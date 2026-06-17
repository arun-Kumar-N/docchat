import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // transformers.js loads native ONNX runtime + model files at runtime —
  // keep it out of the bundler so it works in the server route.
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
