import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
});

const nextConfig = {
  ...(process.env.NODE_ENV === "production" && { output: "export" }),
  images: {
    unoptimized: true,
  },
};

export default withNextra(nextConfig);
