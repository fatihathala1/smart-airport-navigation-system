export function BaseMapLayer({ asset, label, imageWidth, imageHeight, crop }: {
  asset: string;
  label: string;
  imageWidth: number;
  imageHeight: number;
  crop: { x: number; y: number; width: number; height: number };
}) {
  const isVector = asset.toLowerCase().endsWith(".svg");

  return (
    <g data-layer="basemap" aria-label={`Basemap ${label}`}>
      <rect x="18" y="50" width="964" height="600" rx="28" fill="var(--map-surface)" stroke="var(--map-outline)" strokeWidth="1.5" />
      <svg x="38" y="76" width="924" height="548" viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="xMidYMid meet" overflow="hidden">
        <image
          href={asset}
          width={imageWidth}
          height={imageHeight}
          opacity={isVector ? 0.88 : 0.72}
          pointerEvents="none"
          className="blueprint-image"
          data-vector={isVector ? "true" : "false"}
        />
      </svg>
    </g>
  );
}
