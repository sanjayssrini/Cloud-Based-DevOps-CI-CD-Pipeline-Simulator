import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0D1B2A",
          ocean: "#15616D",
          aqua: "#00A7A7",
          sand: "#F4D58D",
          coral: "#EE6C4D"
        }
      },
      boxShadow: {
        ambient: "0 20px 50px rgba(21, 97, 109, 0.18)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 20% 20%, rgba(0, 167, 167, 0.25), transparent 32%), radial-gradient(circle at 85% 15%, rgba(238,108,77,0.2), transparent 25%), linear-gradient(140deg, #f8fbfd, #ecf4f8)"
      }
    }
  },
  plugins: []
} satisfies Config;
