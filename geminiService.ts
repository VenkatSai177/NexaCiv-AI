
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIRiskAnalysis, RiskLevel } from './types';

// Always use named parameter and process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeIncidentEvidence(base64Data: string, mimeType: string): Promise<AIRiskAnalysis> {
  const model = 'gemini-3-flash-preview';

  const part = {
    inlineData: {
      mimeType: mimeType,
      data: base64Data.split(',')[1] || base64Data,
    },
  };

  const isVideo = mimeType.includes('video');

  const textPart = {
    text: `You are the DisasterLens X CivicGuard Autonomous Evidence Engine. 
    Analyze this ${isVideo ? 'video sequence' : 'imagery'} for structural hazards, civic issues, or ${isVideo ? 'official misconduct/corruption indicators' : 'structural damage'}. 
    
    DETECTABLE CLASSES:
    - Civic Hazards (Potholes, Road collapse, Drainage overflow, Debris, Leaning poles)
    - Structural Risks (Bridge cracks, Building facade fracture, Sinkholes)
    - Misconduct/Corruption (Bribery, Officer abuse, Harassment, Extortion, Negligence, Fraudulent works)
    
    If video: Extract motion anomalies, detected objects, and stress intensity.
    
    Return JSON only.
    Assign RiskLevel: CRITICAL, HIGH, MODERATE, LOW.
    Assign UrgencyLevel: IMMEDIATE, HIGH, ROUTINE.
    Impact Radius: e.g. "50m".
    ConfidenceScore: 0.0 to 1.0.
    
    Field details for misconduct: misconductPatterns, sentimentScore (-1 to 1), detectedObjects.`
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [part, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hazardType: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
          confidenceScore: { type: Type.NUMBER },
          impactSeverity: { type: Type.NUMBER },
          impactRadius: { type: Type.STRING },
          urgencyLevel: { type: Type.STRING, enum: ['IMMEDIATE', 'HIGH', 'ROUTINE'] },
          safetyRecommendation: { type: Type.ARRAY, items: { type: Type.STRING } },
          humanReadableExplanation: { type: Type.STRING },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
          misconductPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentimentScore: { type: Type.NUMBER },
        },
        required: [
          'hazardType', 'riskLevel', 'confidenceScore', 'impactSeverity', 
          'impactRadius', 'urgencyLevel', 'safetyRecommendation', 
          'humanReadableExplanation', 'riskFactors'
        ],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI engine failed to produce telemetry.");
  return JSON.parse(text) as AIRiskAnalysis;
}

export async function getAdminRecommendations(caseSummary: string): Promise<string> {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Review the following incident summary and provide a tactical response strategy for city administrators:
    "${caseSummary}"
    Focus on: Deployment logistics, evacuation needs, and technical stabilization steps. If misconduct is suspected, suggest investigation procedures.`,
  });
  return response.text || "Dispatch rapid assessment unit.";
}
