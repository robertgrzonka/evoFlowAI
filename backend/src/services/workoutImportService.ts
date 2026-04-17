type ParsedWorkoutFile = {
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  performedAt: Date;
  notes?: string;
};

const toDateOrNull = (value: string | undefined | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const roundMinutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));

const estimateCalories = (durationMinutes: number, weightKg = 70) => {
  const met = 6.5;
  return Math.max(10, Math.round((met * 3.5 * weightKg / 200) * durationMinutes));
};

const extractAll = (input: string, regex: RegExp) => {
  const matches = [...input.matchAll(regex)];
  return matches.map((entry) => String(entry[1] || '').trim()).filter(Boolean);
};

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const parseGpx = (xml: string, weightKg?: number): ParsedWorkoutFile => {
  const names = extractAll(xml, /<name>([^<]+)<\/name>/g);
  const trackTimes = extractAll(xml, /<time>([^<]+)<\/time>/g).map((value) => toDateOrNull(value)).filter(Boolean) as Date[];
  const points = [...xml.matchAll(/<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>/g)].map((entry) => ({
    lat: Number(entry[1]),
    lon: Number(entry[2]),
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  const start = trackTimes[0] || new Date();
  const end = trackTimes[trackTimes.length - 1] || start;
  const durationMinutes = roundMinutes(Math.max(60, (end.getTime() - start.getTime()) / 1000));

  let distanceMeters = 0;
  for (let index = 1; index < points.length; index += 1) {
    distanceMeters += haversineMeters(points[index - 1].lat, points[index - 1].lon, points[index].lat, points[index].lon);
  }

  return {
    title: names[0] || 'Imported GPX workout',
    durationMinutes,
    caloriesBurned: estimateCalories(durationMinutes, weightKg),
    performedAt: start,
    notes: distanceMeters > 0 ? `Imported from GPX. Distance: ${(distanceMeters / 1000).toFixed(2)} km.` : 'Imported from GPX file.',
  };
};

const parseTcx = (xml: string, weightKg?: number): ParsedWorkoutFile => {
  const ids = extractAll(xml, /<Id>([^<]+)<\/Id>/g);
  const trackTimes = extractAll(xml, /<Time>([^<]+)<\/Time>/g).map((value) => toDateOrNull(value)).filter(Boolean) as Date[];
  const distanceCandidates = extractAll(xml, /<DistanceMeters>([^<]+)<\/DistanceMeters>/g).map((value) => Number(value)).filter((value) => Number.isFinite(value));
  const caloriesCandidates = extractAll(xml, /<Calories>([^<]+)<\/Calories>/g).map((value) => Number(value)).filter((value) => Number.isFinite(value));

  const start = trackTimes[0] || toDateOrNull(ids[0]) || new Date();
  const end = trackTimes[trackTimes.length - 1] || start;
  const durationMinutes = roundMinutes(Math.max(60, (end.getTime() - start.getTime()) / 1000));
  const distanceMeters = distanceCandidates.length > 0 ? Math.max(...distanceCandidates) : 0;
  const calories = caloriesCandidates.length > 0 ? Math.max(...caloriesCandidates) : estimateCalories(durationMinutes, weightKg);

  return {
    title: 'Imported TCX workout',
    durationMinutes,
    caloriesBurned: Math.max(10, Math.round(calories)),
    performedAt: start,
    notes: distanceMeters > 0 ? `Imported from TCX. Distance: ${(distanceMeters / 1000).toFixed(2)} km.` : 'Imported from TCX file.',
  };
};

const parseFit = async (buffer: Buffer, weightKg?: number): Promise<ParsedWorkoutFile> => {
  const FitParser = require('fit-file-parser');
  const parser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'both',
  });

  const parsed: any = await new Promise((resolve, reject) => {
    parser.parse(buffer, (error: any, data: any) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });

  const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions : [];
  const firstSession = sessions[0] || {};
  const records = Array.isArray(parsed?.records) ? parsed.records : [];
  const firstRecordTime = toDateOrNull(firstSession?.start_time || records[0]?.timestamp) || new Date();
  const durationSeconds = Number(firstSession?.total_elapsed_time || firstSession?.total_timer_time || 0);
  const durationMinutes = durationSeconds > 0 ? roundMinutes(durationSeconds) : Math.max(1, Math.round(records.length / 6));
  const caloriesFromFile = Number(firstSession?.total_calories || 0);
  const caloriesBurned = caloriesFromFile > 0 ? Math.round(caloriesFromFile) : estimateCalories(durationMinutes, weightKg);

  return {
    title: 'Imported FIT workout',
    durationMinutes,
    caloriesBurned,
    performedAt: firstRecordTime,
    notes: 'Imported from FIT file.',
  };
};

export const parseWorkoutFile = async (input: {
  fileName: string;
  fileBuffer: Buffer;
  weightKg?: number;
}) => {
  const extension = input.fileName.toLowerCase().split('.').pop() || '';
  const content = input.fileBuffer.toString('utf-8');

  if (extension === 'gpx') {
    return parseGpx(content, input.weightKg);
  }
  if (extension === 'tcx') {
    return parseTcx(content, input.weightKg);
  }
  if (extension === 'fit') {
    return parseFit(input.fileBuffer, input.weightKg);
  }

  throw new Error('Unsupported file format. Use GPX, TCX, or FIT.');
};
