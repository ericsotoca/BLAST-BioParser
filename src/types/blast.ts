export interface AlignmentPair {
  qseq: string;      // Query alignment string (e.g. "ATCG--TC")
  hseq: string;      // Subject alignment string (e.g. "ATCGATTC")
  midline: string;   // Midline consensus string (e.g. "||||  ||")
  qstart: number;    // Start position in Query
  qend: number;      // End position in Query
  sstart: number;    // Start position in Subject
  send: number;      // End position in Subject
}

export interface BlastHit {
  id: string;               // Unique ID generated for frontend list keying
  queryId: string;          // Query sequence ID
  queryDef?: string;        // Query sequence description
  queryLen?: number;        // Query sequence length
  subjectId: string;        // Subject sequence ID (e.g. Accession)
  subjectDef?: string;      // Subject sequence description
  subjectLen?: number;      // Subject sequence length
  identity: number;         // Identity percentage (0-100)
  alignLen: number;         // Length of the alignment
  mismatches: number;       // Number of mismatches
  gaps: number;             // Number of gaps
  qstart: number;           // Query start (1-based)
  qend: number;             // Query end (1-based)
  sstart: number;           // Subject start (1-based)
  send: number;             // Subject end (1-based)
  evalue: number;           // E-value as float
  evalueStr: string;        // E-value as original string (handles things like "0.0" or "3e-45")
  bitscore: number;         // Bit score
  queryCoverage?: number;   // Calculated query coverage percentage (0-100)
  organism?: string;        // Extracted organism if available in subjectDef
  alignment?: AlignmentPair; // Detailed pairwise alignment block (optional)
}

export interface ParsedBlastResult {
  format: 'tabular' | 'xml' | 'text';
  program: string;          // blastn, blastp, blastx, etc.
  database: string;
  queryId?: string;
  queryDef?: string;
  queryLen?: number;
  hits: BlastHit[];
}
