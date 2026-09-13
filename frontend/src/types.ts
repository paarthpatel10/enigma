export type Experiment = {
  id: string;
  name: string;
  created_at: string;
  status: string;
  completed: number;
  total: number;
  failed: number;
  category: string;
};
export type Estimate = {
  count: number;
  total: number;
  probability: number | null;
  interval: number[] | null;
};
export type BrandMetric = {
  brand: string;
  mentions: number;
  total: number;
  probability: number | null;
  recommendations: number;
  interval: number[] | null;
  by_model: Record<string, Estimate>;
};
export type Detail = Experiment & {
  manifest: {
    brands: string[];
    prompts: string[];
    models: string[];
    repeats: number;
    geography: string;
    persona: string;
    version: string;
    settings: { seed: number };
    [key: string]: unknown;
  };
  summary: {
    successful: number;
    failed: number;
    responses_with_citations: number;
    brands: BrandMetric[];
  };
};
export type Run = {
  id: string;
  experiment_id: string;
  model: string;
  prompt: string;
  prompt_variant: string;
  timestamp: string;
  status: string;
  raw_text: string;
  mentions: string[];
  recommendations: Record<string, number>;
  citations: string[];
  run_number: number;
  error: string | null;
  exclusion_reason: string | null;
  manifest_sha256: string;
  [key: string]: unknown;
};
