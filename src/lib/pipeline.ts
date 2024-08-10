import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers";

// Use the Singleton pattern to enable lazy construction of the pipeline.
// NOTE: We wrap the class in a function to prevent code duplication (see below).
const P = () =>
  class PipelineSingleton {
    static model = "Xenova/all-MiniLM-L6-v2";
    static instance: null | Promise<FeatureExtractionPipeline> = null;

    static async getInstance() {
      if (this.instance === null) {
        this.instance = pipeline("feature-extraction", this.model);
      }
      return this.instance;
    }
  };

declare const globalThis: {
  pipelineSingletonGlobal: ReturnType<typeof P>;
} & typeof global;

const pipelineSingleton = globalThis.pipelineSingletonGlobal ?? P();

if (process.env.NODE_ENV !== "production") {
  globalThis.pipelineSingletonGlobal = pipelineSingleton;
}
export default pipelineSingleton;

export async function getTransformersEmbeddings(text: string) {
  const extractor = await pipelineSingleton.getInstance();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  const embedding: number[] = Array.from(output.data);

  if (!embedding) throw Error("Error generating embedding.");

  return embedding;
}
