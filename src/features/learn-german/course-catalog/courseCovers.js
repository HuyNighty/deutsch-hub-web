// Temporary frontend registry while GET /courses has no media field.
const images = import.meta.glob("./assets/covers/*.{avif,jpeg,jpg,png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});

const coversById = new Map();
for (const path of Object.keys(images).sort()) {
  const id = path.match(/\/([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})\.[^.]+$/i)?.[1];
  if (id && !coversById.has(id.toLowerCase())) {
    coversById.set(id.toLowerCase(), images[path]);
  }
}

const palettes = [
  ["#173d36", "#31655a", "#edbb91"],
  ["#292e49", "#535878", "#dbc496"],
  ["#412a36", "#805367", "#f0c09d"],
  ["#263b46", "#3d6572", "#f1c4a3"],
  ["#40432c", "#6e754d", "#edd8a5"],
  ["#48342a", "#825c41", "#ebc5a1"],
];

export function getCourseCover(courseId) {
  const id = String(courseId).toLowerCase();
  let seed = 2166136261;
  for (let i = 0; i < id.length; i++) {
    seed = Math.imul(seed ^ id.charCodeAt(i), 16777619) >>> 0;
  }

  const digits = id.replaceAll("-", "");
  // The full UUID also shapes the print marks, so a shared palette or seed
  // does not make two different course UUIDs display the same illustration.
  const marks = [...digits].map((digit) => Number.parseInt(digit, 16) || 0);
  const [ink, mid, light] = palettes[seed % palettes.length];

  return {
    image: coversById.get(id),
    marks,
    style: {
      "--cover-ink": ink,
      "--cover-mid": mid,
      "--cover-light": light,
      "--cover-sun-x": `${33 + ((seed >>> 8) % 36)}%`,
      "--cover-ridge-angle": `${112 + ((seed >>> 16) % 38)}deg`,
    },
  };
}
