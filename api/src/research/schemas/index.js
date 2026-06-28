const { z } = require("zod");

const ArtifactSchema = z.object({
  title: z.string().min(1),
  artifactType: z.string().optional(),
  summary: z.string().optional(),
  content: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1).default(1),
  importance: z.number().min(0).max(1).default(0.5),
  status: z.string().default("active"),
  sourceCoverageCount: z.number().int().optional(),
  firstSeenSourceId: z.string().uuid().optional()
});

const EvidenceSchema = z.object({
  artifactId: z.string().optional(),
  artifactIndex: z.number().int().optional(),
  sourceId: z.string(),
  chunkId: z.string().optional(),
  quote: z.string().optional(),
  evidenceType: z.string().default("supports"),
  confidence: z.number().min(0).max(1).default(1)
});

const ConnectionSchema = z.object({
  fromArtifactId: z.string().optional(),
  toArtifactId: z.string().optional(),
  fromArtifactIndex: z.number().int().optional(),
  toArtifactIndex: z.number().int().optional(),
  connectionType: z.string().min(1),
  label: z.string().optional(),
  explanation: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1),
  strength: z.number().min(0).max(1).default(0.5)
});

const ConnectionEvidenceSchema = z.object({
  connectionId: z.string().optional(),
  connectionIndex: z.number().int().optional(),
  sourceId: z.string().optional(),
  chunkId: z.string().optional(),
  artifactId: z.string().optional(),
  quote: z.string().optional(),
  explanation: z.string().optional()
});

const MergeSuggestionSchema = z.object({
  keepArtifactId: z.string(),
  discardArtifactId: z.string(),
  reason: z.string().min(1)
});

const RefinementSchema = z.object({
  artifactId: z.string(),
  updates: z.object({
    confidence: z.number().min(0).max(1).optional(),
    importance: z.number().min(0).max(1).optional(),
    summary: z.string().optional(),
    status: z.string().optional()
  })
});

const StatusChangeSchema = z.object({
  artifactId: z.string(),
  status: z.string().min(1),
  reason: z.string().optional()
});

const ObservationOutputSchema = z.object({
  artifacts: z.array(ArtifactSchema).min(1, "At least one artifact is required"),
  evidence: z.array(EvidenceSchema).min(1, "At least one evidence entry is required")
});

const ConnectionOutputSchema = z.object({
  connections: z.array(ConnectionSchema).default([]),
  connectionEvidence: z.array(ConnectionEvidenceSchema).default([]),
  artifacts: z.array(ArtifactSchema).default([])
});

const UnderstandingOutputSchema = z.object({
  newArtifacts: z.array(ArtifactSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  mergeSuggestions: z.array(MergeSuggestionSchema).default([]),
  refinements: z.array(RefinementSchema).default([])
});

const ReflectionOutputSchema = z.object({
  newArtifacts: z.array(ArtifactSchema).default([]),
  connections: z.array(ConnectionSchema).default([]),
  statusChanges: z.array(StatusChangeSchema).default([])
});

const ViewSectionSchema = z.object({
  id: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string(),
  type: z.string().optional(),
  body: z.string().optional(),
  content: z.string().optional(),
  items: z.array(z.any()).optional()
});

const ViewOutputSchema = z.object({
  viewType: z.string().default("report"),
  title: z.string().default("Refinery Report"),
  structure: z.object({
    sections: z.array(ViewSectionSchema).default([])
  }).optional(),
  content: z.object({
    sections: z.array(ViewSectionSchema).default([]),
    metadata: z.object({
      generatedAt: z.string().optional(),
      artifactCount: z.number().optional(),
      connectionCount: z.number().optional(),
      sourceCount: z.number().optional(),
      confidence: z.number().optional()
    }).optional()
  }).optional()
});

const schemas = {
  artifact: ArtifactSchema,
  evidence: EvidenceSchema,
  connection: ConnectionSchema,
  connectionEvidence: ConnectionEvidenceSchema,
  mergeSuggestion: MergeSuggestionSchema,
  refinement: RefinementSchema,
  statusChange: StatusChangeSchema,
  viewSection: ViewSectionSchema,
  outputs: {
    observe: ObservationOutputSchema,
    connect: ConnectionOutputSchema,
    understand: UnderstandingOutputSchema,
    reflect: ReflectionOutputSchema,
    generateView: ViewOutputSchema
  }
};

module.exports = schemas;
