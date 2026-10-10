export async function base64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]!);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export async function receiptImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15000000)
    throw new Error("Please choose a JPG, PNG or WebP image under 15 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image could not be read"))),
      "image/jpeg",
      0.85,
    ),
  );
  return { data: await base64(blob), url: URL.createObjectURL(blob) };
}
function wav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const text = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  text(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) =>
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * (s < 0 ? 32768 : 32767), true),
  );
  return new Blob([buffer], { type: "audio/wav" });
}
export async function recordWav() {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("Microphone requires a secure HTTPS connection and a supported browser.");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const chunks: Float32Array[] = [];
  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);
  processor.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout>;
  const stop = async () => {
    if (stopped) return null;
    stopped = true;
    clearTimeout(timeout);
    processor.disconnect();
    source.disconnect();
    mute.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    const sampleRate = ctx.sampleRate;
    await ctx.close();
    const length = chunks.reduce((s, c) => s + c.length, 0);
    const samples = new Float32Array(length);
    let offset = 0;
    for (const c of chunks) {
      samples.set(c, offset);
      offset += c.length;
    }
    return wav(samples, sampleRate);
  };
  return {
    stop,
    setAutoStop: (callback: () => void) => {
      timeout = setTimeout(callback, 30000);
    },
  };
}
