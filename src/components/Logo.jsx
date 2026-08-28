import { useState } from "react"
import { Heart } from "lucide-react"

// The script wordmark font (loaded via Google Fonts in index.html). Applied
// inline so it always wins over any tracking/weight utility classes a
// caller passes in textClassName — cursive scripts read badly with the wide
// letter-spacing and heavy weight tuned for the old sans-serif wordmark.
const WORDMARK_STYLE = {
  fontFamily: "'Dancing Script', cursive",
  fontWeight: 700,
  letterSpacing: "normal",
}

function Wordmark({ className }) {
  return (
    <span className={className} style={WORDMARK_STYLE}>
      Paws & Care
    </span>
  )
}

// logo.png is the full lockup (icon + "Paws & Care" wordmark + tagline) on a
// square canvas, with the icon occupying roughly the top two-thirds. For
// small "icon" placements (navbar, sidebars) we crop in on just the icon via
// object-position + oversizing, so it reads as a mark rather than a blurry
// shrunken poster. The "full" variant shows the whole artwork uncropped for
// bigger, standalone placements (login/register panels, footer).
export default function Logo({
  size = 36,
  showText = true,
  textClassName = "text-base font-bold tracking-[0.18em]",
  subClassName = "block text-[9px] tracking-wide text-[#78847e]",
  dark = false,
  variant = "icon",
}) {
  const [imageFailed, setImageFailed] = useState(false)

  if (variant === "full") {
    return (
      <span className="flex flex-col items-start">
        {imageFailed ? (
          <span
            className={`flex shrink-0 items-center justify-center rounded-full ${
              dark ? "bg-white text-[#173b31]" : "bg-[#173b31] text-white"
            }`}
            style={{ width: size, height: size }}
          >
            <Heart size={size * 0.47} fill="currentColor" />
          </span>
        ) : (
          <img
            src="/logo.png"
            alt="Paws & Care, a unit of Deivayanai Pet Clinic"
            onError={() => setImageFailed(true)}
            style={{ height: size, width: "auto" }}
            className="object-contain"
          />
        )}

        {showText && imageFailed && (
          <Wordmark className={`mt-2 ${textClassName}`} />
        )}
        {showText && (
          <span className={`mt-1 ${subClassName}`}>A unit of Deivayanai Pet Clinic</span>
        )}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2">
      {imageFailed ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full ${
            dark ? "bg-white text-[#173b31]" : "bg-[#173b31] text-white"
          }`}
          style={{ width: size, height: size }}
        >
          <Heart size={size * 0.47} fill="currentColor" />
        </span>
      ) : (
        <span
          className="relative shrink-0 overflow-hidden rounded-full"
          style={{ width: size, height: size }}
        >
          <img
            src="/logo.png"
            alt="Paws & Care"
            onError={() => setImageFailed(true)}
            className="absolute"
            style={{
              width: "167%",
              height: "167%",
              left: "-31%",
              top: "-16%",
              maxWidth: "none",
            }}
          />
        </span>
      )}

      {showText && (
        <span>
          <Wordmark className={textClassName} />
          <span className={subClassName}>A unit of Deivayanai Pet Clinic</span>
        </span>
      )}
    </span>
  )
}
