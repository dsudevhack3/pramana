export interface AITamperingResult {
  probability: number | null;
  prediction: string | null;
  model_name: string | null;
  model_available: boolean;
  error: string | null;
}

export interface OcrExtractionResult {
  doctor_name: string | null;
  license_number: string | null;
  clinic_address: string | null;
  drug_names: string[];
  date: string | null;
  patient_name: string | null;
  field_confidence: Record<string, number>;
}

export interface ForensicAnalysisResult {
  flags: string[];
  ela_anomaly_score: number | null;
  metadata_flags: string[];
  timestamp_flags: string[];
  dimension_flags: string[];
  manipulation_flags: string[];
  layout_flags: string[];
  forensic_score: number;
}

export interface TextConsistencyResult {
  score: number;
  status: string;
  flags: string[];
}

export interface LayoutConsistencyResult {
  score: number;
  status: string;
  flags: string[];
}

export interface PhotoVerificationResponse {
  id: string;
  verification_case: string;
  matched_prescription_id: string | null;
  ocr_result: OcrExtractionResult;
  forensic_result: ForensicAnalysisResult | null;
  ai_tampering_result: AITamperingResult | null;
  license_check_passed: boolean | null;
  clinic_check_passed: boolean | null;
  drug_check_passed: boolean | null;
  text_consistency_result: TextConsistencyResult | null;
  layout_consistency_result: LayoutConsistencyResult | null;
  risk_level: string;
  risk_reasons: string[];
  review_status: string;
}
