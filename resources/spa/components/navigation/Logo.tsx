import logoColor from "../../assets/logo_h.png";
import logoInverse from "../../assets/logo_h_branco.png";

export function Logo({
  variant = "color",
  className,
}: {
  variant?: "color" | "inverse";
  className?: string;
}) {
  return (
    <img
      src={variant === "inverse" ? logoInverse : logoColor}
      alt="IFCE Campus Sobral"
      width={1605}
      height={459}
      className={`block h-auto w-[177px] max-w-full ${className ?? ""}`}
    />
  );
}
