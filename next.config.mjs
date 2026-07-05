import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
});

const nextConfig = {
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  // Emit `route/index.html` instead of `route.html`. Next 16's static export
  // also writes sibling `route/` directories full of RSC prefetch payloads
  // (`__next.*.txt`). Without trailing slashes, `route.html` and `route/`
  // collide, and Cloudflare Pages resolves the bare directory (which has no
  // index.html) to a blank page on hard refresh. See the whitepaper refresh
  // bug. Directory-style output resolves cleanly on Cloudflare.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default withNextra(nextConfig);
