import { BlastHit, ParsedBlastResult, AlignmentPair } from '../types/blast';

// Helper to extract organism names (e.g., "[Homo sapiens]" or "Homo sapiens") from descriptions
export function extractOrganism(text: string): string {
  if (!text) return 'Inconnu';
  
  // Try bracketed pattern like "[Homo sapiens]"
  const bracketMatch = text.match(/\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1].trim();
  }
  
  // Look for common scientific naming conventions (Genus species, e.g. "Escherichia coli")
  // Typically follows accession numbers or starts after some identifiers
  const cleanText = text.replace(/^(gi\|[^|]+\||ref\|[^|]+\||\w+\.\d+\s+)/g, '').trim();
  const words = cleanText.split(/\s+/);
  if (words.length >= 2) {
    const word1 = words[0];
    const word2 = words[1];
    // Check if it looks like Genus species (e.g. capitalize Genus, lowercase species or specific word)
    if (/^[A-Z][a-z]+$/.test(word1) && /^[a-z]+$/.test(word2)) {
      return `${word1} ${word2}`;
    }
  }
  
  // Fallback to first few words
  return words.slice(0, 2).join(' ') || 'Inconnu';
}

// Generate a simulated pairwise alignment for tabular inputs that don't have sequences
export function generateSimulatedAlignment(hit: BlastHit): AlignmentPair {
  const length = hit.alignLen;
  const qstart = hit.qstart;
  const qend = hit.qend;
  const sstart = hit.sstart;
  const send = hit.send;
  
  // Determine if it's blastp (amino acids) or blastn (nucleotides)
  const isProtein = hit.identity < 70 && length < 200; // rough heuristic
  const chars = isProtein 
    ? 'ACDEFGHIKLMNPQRSTVWY' 
    : 'ATCG';
    
  let qseq = '';
  let hseq = '';
  let midline = '';
  
  const identCount = Math.round((hit.identity / 100) * length);
  const gapCount = hit.gaps;
  const mismatchCount = length - identCount - gapCount;
  
  let identsPlaced = 0;
  let gapsPlaced = 0;
  let mismatchesPlaced = 0;
  
  for (let i = 0; i < length; i++) {
    // Determine type of character to put at this position
    const roll = Math.random();
    
    if (identsPlaced < identCount && (roll < 0.8 || (gapsPlaced >= gapCount && mismatchesPlaced >= mismatchCount))) {
      // Identity
      const char = chars[Math.floor(Math.random() * chars.length)];
      qseq += char;
      hseq += char;
      midline += isProtein ? char : '|';
      identsPlaced++;
    } else if (gapsPlaced < gapCount && (roll < 0.9 || mismatchesPlaced >= mismatchCount)) {
      // Gap
      if (Math.random() > 0.5) {
        qseq += '-';
        hseq += chars[Math.floor(Math.random() * chars.length)];
      } else {
        qseq += chars[Math.floor(Math.random() * chars.length)];
        hseq += '-';
      }
      midline += ' ';
      gapsPlaced++;
    } else if (mismatchesPlaced < mismatchCount) {
      // Mismatch
      const qchar = chars[Math.floor(Math.random() * chars.length)];
      let hchar = chars[Math.floor(Math.random() * chars.length)];
      while (hchar === qchar && chars.length > 1) {
        hchar = chars[Math.floor(Math.random() * chars.length)];
      }
      qseq += qchar;
      hseq += hchar;
      midline += isProtein ? '+' : ' '; // + represents conservative substitution in blastp
      mismatchesPlaced++;
    } else {
      // Fallback to Identity
      const char = chars[Math.floor(Math.random() * chars.length)];
      qseq += char;
      hseq += char;
      midline += isProtein ? char : '|';
    }
  }
  
  return {
    qseq,
    hseq,
    midline,
    qstart,
    qend,
    sstart,
    send
  };
}

/**
 * PARSES XML BLAST OUTPUT (OUTFMT 5)
 */
export function parseXMLBlast(xmlText: string): ParsedBlastResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error("Erreur de parsing XML : " + parseError[0].textContent);
  }
  
  const program = xmlDoc.getElementsByTagName('BlastOutput_program')[0]?.textContent || 'blast';
  const database = xmlDoc.getElementsByTagName('BlastOutput_db')[0]?.textContent || 'Inconnue';
  const queryId = xmlDoc.getElementsByTagName('BlastOutput_query-ID')[0]?.textContent || 'query';
  const queryDef = xmlDoc.getElementsByTagName('BlastOutput_query-def')[0]?.textContent || 'Requête sans nom';
  const queryLenVal = xmlDoc.getElementsByTagName('BlastOutput_query-len')[0]?.textContent;
  const queryLen = queryLenVal ? parseInt(queryLenVal, 10) : undefined;
  
  const hitElements = xmlDoc.getElementsByTagName('Hit');
  const hits: BlastHit[] = [];
  
  for (let i = 0; i < hitElements.length; i++) {
    const hitEl = hitElements[i];
    const subjectId = hitEl.getElementsByTagName('Hit_id')[0]?.textContent || `subject_${i}`;
    const subjectDef = hitEl.getElementsByTagName('Hit_def')[0]?.textContent || '';
    const subjectLenVal = hitEl.getElementsByTagName('Hit_len')[0]?.textContent;
    const subjectLen = subjectLenVal ? parseInt(subjectLenVal, 10) : undefined;
    const organism = extractOrganism(subjectDef);
    
    const hspElements = hitEl.getElementsByTagName('Hsp');
    for (let j = 0; j < hspElements.length; j++) {
      const hspEl = hspElements[j];
      const hspNum = hspEl.getElementsByTagName('Hsp_num')[0]?.textContent || `${j + 1}`;
      const bitscore = parseFloat(hspEl.getElementsByTagName('Hsp_bit-score')[0]?.textContent || '0');
      const evalueStr = hspEl.getElementsByTagName('Hsp_evalue')[0]?.textContent || '0';
      const evalue = parseFloat(evalueStr);
      const qstart = parseInt(hspEl.getElementsByTagName('Hsp_query-from')[0]?.textContent || '0', 10);
      const qend = parseInt(hspEl.getElementsByTagName('Hsp_query-to')[0]?.textContent || '0', 10);
      const sstart = parseInt(hspEl.getElementsByTagName('Hsp_hit-from')[0]?.textContent || '0', 10);
      const send = parseInt(hspEl.getElementsByTagName('Hsp_hit-to')[0]?.textContent || '0', 10);
      
      const identityCount = parseInt(hspEl.getElementsByTagName('Hsp_identity')[0]?.textContent || '0', 10);
      const alignLen = parseInt(hspEl.getElementsByTagName('Hsp_align-len')[0]?.textContent || '0', 10);
      const gaps = parseInt(hspEl.getElementsByTagName('Hsp_gaps')[0]?.textContent || '0', 10);
      const identity = alignLen > 0 ? (identityCount / alignLen) * 100 : 0;
      const mismatches = alignLen - identityCount - gaps;
      
      const qseq = hspEl.getElementsByTagName('Hsp_qseq')[0]?.textContent || '';
      const hseq = hspEl.getElementsByTagName('Hsp_hseq')[0]?.textContent || '';
      const midline = hspEl.getElementsByTagName('Hsp_midline')[0]?.textContent || '';
      
      const queryCoverage = queryLen ? (Math.abs(qend - qstart) + 1) / queryLen * 100 : undefined;
      
      const id = `${subjectId}_hsp_${hspNum}`;
      
      const alignment: AlignmentPair = {
        qseq,
        hseq,
        midline,
        qstart,
        qend,
        sstart,
        send
      };
      
      hits.push({
        id,
        queryId,
        queryDef,
        queryLen,
        subjectId,
        subjectDef,
        subjectLen,
        identity,
        alignLen,
        mismatches,
        gaps,
        qstart,
        qend,
        sstart,
        send,
        evalue,
        evalueStr,
        bitscore,
        queryCoverage,
        organism,
        alignment
      });
    }
  }
  
  return {
    format: 'xml',
    program,
    database,
    queryId,
    queryDef,
    queryLen,
    hits
  };
}

/**
 * PARSES TABULAR BLAST OUTPUT (OUTFMT 6 & 7)
 */
export function parseTabularBlast(text: string): ParsedBlastResult {
  const lines = text.split(/\r?\n/);
  const hits: BlastHit[] = [];
  
  let program = 'blastn';
  let database = 'Inconnue';
  let queryId: string | undefined;
  let queryDef: string | undefined;
  let queryLen: number | undefined;
  
  // Default headers for standard outfmt 6
  let columns = [
    'qseqid', 'sseqid', 'pident', 'length', 'mismatch', 'gapopen',
    'qstart', 'qend', 'sstart', 'send', 'evalue', 'bitscore'
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Parse comments in outfmt 7
    if (trimmed.startsWith('#')) {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith('# blast')) {
        // e.g. "# BLASTN 2.12.0+"
        const parts = trimmed.split(/\s+/);
        program = parts[1]?.toLowerCase() || 'blast';
      } else if (lower.startsWith('# query:')) {
        // e.g. "# Query: gi|568815591| Escherichia coli str. K-12 substr. MG1655"
        const queryText = trimmed.substring('# query:'.length).trim();
        const parts = queryText.split(/\s+/);
        queryId = parts[0];
        queryDef = queryText;
      } else if (lower.startsWith('# database:')) {
        database = trimmed.substring('# database:'.length).trim();
      } else if (lower.includes('fields:')) {
        // e.g. "# Fields: query id, subject id, % identity, alignment length, mismatches, gap opens, q. start, q. end, s. start, s. end, evalue, bit score"
        const fieldsStr = trimmed.substring(trimmed.indexOf('fields:') + 7).trim();
        const rawFields = fieldsStr.split(',').map(f => f.trim().toLowerCase());
        
        // Map common field names to our internal column keys
        columns = rawFields.map(f => {
          if (f.includes('query id') || f === 'qseqid') return 'qseqid';
          if (f.includes('subject id') || f === 'sseqid') return 'sseqid';
          if (f.includes('% identity') || f === 'pident') return 'pident';
          if (f.includes('alignment length') || f === 'length') return 'length';
          if (f.includes('mismatches') || f === 'mismatch') return 'mismatch';
          if (f.includes('gap opens') || f === 'gapopen') return 'gapopen';
          if (f.includes('q. start') || f === 'qstart') return 'qstart';
          if (f.includes('q. end') || f === 'qend') return 'qend';
          if (f.includes('s. start') || f === 'sstart') return 'sstart';
          if (f.includes('s. end') || f === 'send') return 'send';
          if (f.includes('evalue') || f === 'evalue') return 'evalue';
          if (f.includes('bit score') || f === 'bitscore') return 'bitscore';
          return f; // keep as is
        });
      }
      continue;
    }
    
    // Parse data row
    const cols = trimmed.split(/\t/);
    // If not tabs, fallback to splitting by multiple spaces
    const finalCols = cols.length >= 3 ? cols : trimmed.split(/\s+/);
    
    if (finalCols.length < 3) continue; // too few columns
    
    // Map column values
    const data: Record<string, string> = {};
    columns.forEach((colName, index) => {
      if (index < finalCols.length) {
        data[colName] = finalCols[index];
      }
    });
    
    const hitQueryId = data['qseqid'] || queryId || 'query';
    const subjectId = data['sseqid'] || 'subject';
    const identity = parseFloat(data['pident'] || '0');
    const alignLen = parseInt(data['length'] || '0', 10);
    const mismatches = parseInt(data['mismatch'] || '0', 10);
    const gaps = parseInt(data['gapopen'] || '0', 10);
    const qstart = parseInt(data['qstart'] || '0', 10);
    const qend = parseInt(data['qend'] || '0', 10);
    const sstart = parseInt(data['sstart'] || '0', 10);
    const send = parseInt(data['send'] || '0', 10);
    const evalueStr = data['evalue'] || '0';
    const evalue = parseFloat(evalueStr);
    const bitscore = parseFloat(data['bitscore'] || '0');
    
    if (!queryId) queryId = hitQueryId;
    
    // Estimate query coverage or update queryLen if possible
    if (!queryLen || queryLen < qend) {
      queryLen = Math.max(queryLen || 0, qend);
    }
    
    const id = `${subjectId}_row_${hits.length}`;
    const subjectDef = `Subject match ${subjectId}`;
    const organism = extractOrganism(subjectId);
    
    const hit: BlastHit = {
      id,
      queryId: hitQueryId,
      queryDef: queryDef || `Sequence Requête ${hitQueryId}`,
      subjectId,
      subjectDef,
      identity,
      alignLen,
      mismatches,
      gaps,
      qstart,
      qend,
      sstart,
      send,
      evalue,
      evalueStr,
      bitscore,
      organism
    };
    
    // Generate simulated alignment since tabular doesn't provide sequence characters
    hit.alignment = generateSimulatedAlignment(hit);
    hits.push(hit);
  }
  
  // Calculate final coverage based on estimated queryLen
  hits.forEach(hit => {
    if (queryLen) {
      hit.queryLen = queryLen;
      hit.queryCoverage = (Math.abs(hit.qend - hit.qstart) + 1) / queryLen * 100;
    }
  });
  
  return {
    format: 'tabular',
    program,
    database,
    queryId,
    queryDef: queryDef || `Requête ${queryId || 'Inconnue'}`,
    queryLen,
    hits
  };
}

/**
 * PARSES TEXT FORMAT (OUTFMT 0)
 */
export function parseTextBlast(text: string): ParsedBlastResult {
  const hits: BlastHit[] = [];
  let program = 'blastn';
  let database = 'Inconnue';
  let queryId = 'query';
  let queryDef = 'Requête sans nom';
  let queryLen: number | undefined;
  
  // Extract Program
  const progMatch = text.match(/^(BLASTN|BLASTP|BLASTX|TBLASTN|TBLASTX)\s+(\d+\.\d+\.\d+\+?)/i);
  if (progMatch) {
    program = progMatch[1].toLowerCase();
  }
  
  // Extract Query Info
  const queryMatch = text.match(/Query=\s*([^\n]+)/);
  if (queryMatch) {
    queryDef = queryMatch[1].trim();
    const idPart = queryDef.split(/\s+/)[0];
    queryId = idPart;
  }
  
  const lenMatch = text.match(/Length=(\d+)/);
  // Match query length (which comes early, typically before "Database:")
  const firstDatabaseIndex = text.indexOf('Database:');
  const textBeforeDb = firstDatabaseIndex !== -1 ? text.substring(0, firstDatabaseIndex) : text;
  const qlenMatch = textBeforeDb.match(/Length=(\d+)/i);
  if (qlenMatch) {
    queryLen = parseInt(qlenMatch[1], 10);
  }
  
  // Extract Database Info
  const dbMatch = text.match(/Database:\s*([^\n]+)/);
  if (dbMatch) {
    database = dbMatch[1].trim();
  }
  
  // To parse alignments, we split the text by sequence entries.
  // Each subject hit alignment section starts with a line like ">Accession description"
  const hitSections = text.split(/^>/m);
  
  if (hitSections.length > 1) {
    // The first section is the header before the first ">"
    for (let i = 1; i < hitSections.length; i++) {
      const section = hitSections[i];
      const lines = section.split('\n');
      if (lines.length === 0) continue;
      
      const firstLine = lines[0].trim();
      const subjectId = firstLine.split(/\s+/)[0];
      const subjectDef = firstLine;
      const organism = extractOrganism(subjectDef);
      
      // Look for Subject length
      let subjectLen: number | undefined;
      const subLenMatch = section.match(/Length\s*=\s*(\d+)/i);
      if (subLenMatch) {
        subjectLen = parseInt(subLenMatch[1], 10);
      }
      
      // Parse HSPs inside this section. Each HSP begins with Score = ...
      // Let's split this section's content by "Score = "
      const hspSections = section.split(/Score\s*=\s*/i);
      // The first element of hspSections is metadata before the first HSP.
      for (let k = 1; k < hspSections.length; k++) {
        const hspContent = hspSections[k];
        
        // Match score and E-value
        // e.g. "Score = 1500 bits (812),  Expect = 0.0" -> in our content it starts right after Score =
        // "1500 bits (812),  Expect = 0.0" or similar
        const scoreMatch = hspContent.match(/^(\d+(\.\d+)?)\s+bits.*Expect\s*=\s*([0-9e.-]+)/i);
        if (!scoreMatch) continue;
        
        const bitscore = parseFloat(scoreMatch[1]);
        const evalueStr = scoreMatch[3];
        const evalue = parseFloat(evalueStr);
        
        // Match Identities and Gaps
        // e.g., "Identities = 812/812 (100%), Gaps = 0/812 (0%)"
        const identMatch = hspContent.match(/Identities\s*=\s*(\d+)\/(\d+)\s*\((\d+)%\)/i);
        const gapsMatch = hspContent.match(/Gaps\s*=\s*(\d+)\//i);
        
        let identity = 0;
        let alignLen = 0;
        let mismatches = 0;
        let gaps = 0;
        
        if (identMatch) {
          const idCount = parseInt(identMatch[1], 10);
          alignLen = parseInt(identMatch[2], 10);
          identity = parseFloat(identMatch[3]);
          gaps = gapsMatch ? parseInt(gapsMatch[1], 10) : 0;
          mismatches = alignLen - idCount - gaps;
        }
        
        // Extract Alignment sequences
        // Séquence matches occur in blocks of Query/Sbjct lines:
        // Query  101  ATCG...  160
        //             ||||
        // Sbjct  5001 ATCG...  5060
        const qseqLines: string[] = [];
        const hseqLines: string[] = [];
        const midlineLines: string[] = [];
        
        let qstart: number | undefined;
        let qend: number | undefined;
        let sstart: number | undefined;
        let send: number | undefined;
        
        // Look through lines for alignment blocks
        const hspLines = hspContent.split('\n');
        for (let l = 0; l < hspLines.length; l++) {
          const line = hspLines[l];
          if (line.trim().startsWith('Query')) {
            // e.g. "Query  101  ATCGATCG  160"
            const qMatch = line.match(/Query\s+(\d+)\s+([A-Za-z.-]+)\s+(\d+)/);
            if (qMatch) {
              const startCoord = parseInt(qMatch[1], 10);
              const seq = qMatch[2];
              const endCoord = parseInt(qMatch[3], 10);
              
              if (qstart === undefined) qstart = startCoord;
              qend = endCoord;
              qseqLines.push(seq);
              
              // Next line should be the consensus midline
              const midlineLine = hspLines[l + 1] || '';
              // It is aligned with the characters, so let's slice it to match sequence width
              // Sbjct line is usually 2 lines below
              let sMatchLine = '';
              let sIndex = l + 2;
              while (sIndex < hspLines.length) {
                if (hspLines[sIndex].trim().startsWith('Sbjct')) {
                  sMatchLine = hspLines[sIndex];
                  break;
                }
                sIndex++;
              }
              
              const sMatch = sMatchLine.match(/Sbjct\s+(\d+)\s+([A-Za-z.-]+)\s+(\d+)/);
              if (sMatch) {
                const sStartCoord = parseInt(sMatch[1], 10);
                const sSeq = sMatch[2];
                const sEndCoord = parseInt(sMatch[3], 10);
                
                if (sstart === undefined) sstart = sStartCoord;
                send = sEndCoord;
                hseqLines.push(sSeq);
                
                // Get the midline by aligning with Query index
                // Query line looks like: "Query  101  ATCGATCG  160"
                // The sequence starts at index of 'ATCGATCG'
                const seqIndexInQuery = line.indexOf(seq);
                const extractedMidline = midlineLine.substring(seqIndexInQuery, seqIndexInQuery + seq.length);
                // Pad it if shorter
                midlineLines.push(extractedMidline.padEnd(seq.length, ' '));
              }
            }
          }
        }
        
        const qseq = qseqLines.join('');
        const hseq = hseqLines.join('');
        const midline = midlineLines.join('');
        
        const finalQstart = qstart ?? 0;
        const finalQend = qend ?? 0;
        const finalSstart = sstart ?? 0;
        const finalSend = send ?? 0;
        
        const queryCoverage = queryLen ? (Math.abs(finalQend - finalQstart) + 1) / queryLen * 100 : undefined;
        
        const id = `${subjectId}_hsp_${k}`;
        
        const alignment: AlignmentPair = {
          qseq,
          hseq,
          midline,
          qstart: finalQstart,
          qend: finalQend,
          sstart: finalSstart,
          send: finalSend
        };
        
        hits.push({
          id,
          queryId,
          queryDef,
          queryLen,
          subjectId,
          subjectDef,
          subjectLen,
          identity,
          alignLen,
          mismatches,
          gaps,
          qstart: finalQstart,
          qend: finalQend,
          sstart: finalSstart,
          send: finalSend,
          evalue,
          evalueStr,
          bitscore,
          queryCoverage,
          organism,
          alignment
        });
      }
    }
  }
  
  return {
    format: 'text',
    program,
    database,
    queryId,
    queryDef,
    queryLen,
    hits
  };
}

/**
 * AUTO-DETECT FORMAT AND PARSE
 */
export function parseBlastFile(text: string): ParsedBlastResult {
  const trimmed = text.trim();
  
  if (trimmed.startsWith('<?xml') || trimmed.includes('<BlastOutput>')) {
    return parseXMLBlast(text);
  }
  
  if (trimmed.startsWith('#') || (trimmed.split('\n')[0]?.split('\t').length >= 3)) {
    return parseTabularBlast(text);
  }
  
  // Fallback to text parser
  try {
    const parsedText = parseTextBlast(text);
    if (parsedText.hits.length > 0) {
      return parsedText;
    }
  } catch (err) {
    console.error("Text parsing failed, trying tabular parser as fallback:", err);
  }
  
  // Final desperate fallback is tabular
  return parseTabularBlast(text);
}
