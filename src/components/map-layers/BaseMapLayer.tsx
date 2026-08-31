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
      <svg x="0" y="0" width="1000" height="700" viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="xMidYMid slice" overflow="visible">
        <image
          href={asset}
          width={imageWidth}
          height={imageHeight}
          opacity={isVector ? 0.95 : 0.85}
          pointerEvents="none"
          className="blueprint-image"
          data-vector={isVector ? "true" : "false"}
        />
      </svg>
    </g>
  );
}
