import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dna, 
  Upload, 
  Download, 
  FileText, 
  SlidersHorizontal, 
  Search, 
  BarChart3, 
  Activity, 
  Info, 
  Check, 
  Clipboard, 
  Printer, 
  ArrowUpDown, 
  ExternalLink,
  ChevronRight,
  Globe,
  Database,
  Layers,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis,
  Legend
} from 'recharts';
import { parseBlastFile, extractOrganism } from './utils/blastParser';
import { SAMPLES } from './data/samples';
import { BlastHit, ParsedBlastResult } from './types/blast';

export default function App() {
  // State
  const [rawText, setRawText] = useState<string>(SAMPLES[0].content);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'alignments'>('stats');
  
  // Modal states
  const [showRawInput, setShowRawInput] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Parse result (memoized)
  const parsedResult = useMemo(() => {
    try {
      setFileError(null);
      return parseBlastFile(rawText);
    } catch (err: any) {
      setFileError(err.message || "Erreur de parsing de fichier.");
      return null;
    }
  }, [rawText]);

  // Selected hit for alignment inspection
  const [selectedHitId, setSelectedHitId] = useState<string | null>(null);
  const [hoveredHitId, setHoveredHitId] = useState<string | null>(null);

  // Set default selected hit when parsed result changes
  useEffect(() => {
    if (parsedResult && parsedResult.hits.length > 0) {
      setSelectedHitId(parsedResult.hits[0].id);
    } else {
      setSelectedHitId(null);
    }
  }, [parsedResult]);

  // State ranges of the file (to set filter sliders max)
  const maxValues = useMemo(() => {
    if (!parsedResult || parsedResult.hits.length === 0) {
      return { bitscore: 200, length: 500, count: 0 };
    }
    const scores = parsedResult.hits.map(h => h.bitscore);
    const lengths = parsedResult.hits.map(h => h.alignLen);
    return {
      bitscore: Math.ceil(Math.max(...scores, 100)),
      length: Math.ceil(Math.max(...lengths, 100)),
      count: parsedResult.hits.length
    };
  }, [parsedResult]);

  // Filter settings
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterIdentity, setFilterIdentity] = useState<number>(0);
  const [filterCoverage, setFilterCoverage] = useState<number>(0);
  const [filterEvaluePower, setFilterEvaluePower] = useState<number>(0); // exponent, e.g. -5 represents 1e-5. 0 represents all (1e0 = 1)
  const [filterMinBitscore, setFilterMinBitscore] = useState<number>(0);
  const [filterMinLength, setFilterMinLength] = useState<number>(0);

  // Sort settings
  const [sortField, setSortField] = useState<keyof BlastHit>('bitscore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset filters
  const handleResetFilters = () => {
    setFilterQuery('');
    setFilterIdentity(0);
    setFilterCoverage(0);
    setFilterEvaluePower(0);
    setFilterMinBitscore(0);
    setFilterMinLength(0);
  };

  // Pagination settings
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Filter & sort hits in real time
  const filteredHits = useMemo(() => {
    if (!parsedResult) return [];

    let hits = [...parsedResult.hits];

    // Filter Query (search name, accession, organism)
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      hits = hits.filter(h => 
        h.subjectId.toLowerCase().includes(q) || 
        (h.subjectDef && h.subjectDef.toLowerCase().includes(q)) ||
        (h.organism && h.organism.toLowerCase().includes(q)) ||
        h.queryId.toLowerCase().includes(q)
      );
    }

    // Filter Identity
    if (filterIdentity > 0) {
      hits = hits.filter(h => h.identity >= filterIdentity);
    }

    // Filter Coverage
    if (filterCoverage > 0) {
      hits = hits.filter(h => h.queryCoverage !== undefined && h.queryCoverage >= filterCoverage);
    }

    // Filter E-value Exponent (10^power)
    if (filterEvaluePower < 0) {
      const threshold = Math.pow(10, filterEvaluePower);
      hits = hits.filter(h => h.evalue <= threshold);
    }

    // Filter Min Bitscore
    if (filterMinBitscore > 0) {
      hits = hits.filter(h => h.bitscore >= filterMinBitscore);
    }

    // Filter Min Length
    if (filterMinLength > 0) {
      hits = hits.filter(h => h.alignLen >= filterMinLength);
    }

    // Sort Hits
    hits.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return hits;
  }, [parsedResult, filterQuery, filterIdentity, filterCoverage, filterEvaluePower, filterMinBitscore, filterMinLength, sortField, sortDirection]);

  // Adjust current page if hits shrink
  useEffect(() => {
    const maxPage = Math.ceil(filteredHits.length / rowsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [filteredHits, rowsPerPage, currentPage]);

  // Pagination slice
  const paginatedHits = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHits.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHits, currentPage, rowsPerPage]);

  // Total pages
  const totalPages = Math.ceil(filteredHits.length / rowsPerPage);

  // Sorting click handler
  const handleSort = (field: keyof BlastHit) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Preloaded Samples triggers
  const handleSelectSample = (index: number) => {
    setActiveSampleIndex(index);
    setRawText(SAMPLES[index].content);
    setSuccessMessage(`Échantillon "${SAMPLES[index].name}" chargé avec succès.`);
    handleResetFilters();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Clipboard Paste trigger
  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setRawText(text);
        setActiveSampleIndex(-1);
        setSuccessMessage("Données collées depuis le presse-papiers.");
        setShowRawInput(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      alert("Impossible de lire le presse-papiers. Veuillez coller manuellement dans la boîte de texte.");
    }
  };

  // Drag and Drop files
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
          setActiveSampleIndex(-1);
          setSuccessMessage(`Fichier "${file.name}" importé et analysé.`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  // Manual File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
          setActiveSampleIndex(-1);
          setSuccessMessage(`Fichier "${file.name}" importé et analysé.`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  // Copy Active Hit Alignment String
  const handleCopyAlignment = (hit: BlastHit) => {
    if (!hit.alignment) return;
    const { qseq, midline, hseq, qstart, qend, sstart, send } = hit.alignment;
    const formatted = `Query  ${qstart.toString().padEnd(6)} ${qseq} ${qend}\n` +
                      `       ${"".padEnd(6)} ${midline}\n` +
                      `Sbjct  ${sstart.toString().padEnd(6)} ${hseq} ${send}`;
    navigator.clipboard.writeText(formatted);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Copy Subject Sequence
  const handleCopySubjectSeq = (hit: BlastHit) => {
    if (!hit.alignment) return;
    const cleanSeq = hit.alignment.hseq.replace(/[^A-Za-z]/g, '');
    navigator.clipboard.writeText(cleanSeq);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // CSV/TSV Exporters for currently filtered data
  const handleExportData = (format: 'csv' | 'tsv' | 'json') => {
    if (filteredHits.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `blast_filtered_results.${format}`;

    if (format === 'json') {
      content = JSON.stringify(filteredHits, null, 2);
      mimeType = 'application/json';
    } else {
      const delimiter = format === 'csv' ? ',' : '\t';
      const headers = [
        'Query_ID', 'Subject_ID', 'Organism', 'Identity_Percent', 
        'Alignment_Length', 'Mismatches', 'Gaps', 'Q_Start', 'Q_End', 
        'S_Start', 'S_End', 'E_Value', 'Bit_Score', 'Query_Coverage'
      ];
      
      const rows = filteredHits.map(h => [
        h.queryId,
        h.subjectId,
        h.organism || 'Inconnu',
        h.identity.toFixed(2),
        h.alignLen,
        h.mismatches,
        h.gaps,
        h.qstart,
        h.qend,
        h.sstart,
        h.send,
        h.evalueStr,
        h.bitscore,
        h.queryCoverage ? h.queryCoverage.toFixed(2) : 'N/A'
      ]);

      content = [
        headers.join(delimiter),
        ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(delimiter))
      ].join('\r\n');
      
      mimeType = format === 'csv' ? 'text/csv' : 'text/tab-separated-values';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected hit details object
  const selectedHit = useMemo(() => {
    return filteredHits.find(h => h.id === selectedHitId) || filteredHits[0] || null;
  }, [filteredHits, selectedHitId]);

  // KPI Calculations
  const stats = useMemo(() => {
    if (!parsedResult || filteredHits.length === 0) {
      return {
        total: 0,
        filteredCount: 0,
        bestEvalue: 'N/A',
        avgIdentity: '0.00%',
        bestBitscore: 0,
        dominantOrganism: 'Aucun'
      };
    }

    const total = parsedResult.hits.length;
    const filteredCount = filteredHits.length;
    
    // Best E-value (smallest)
    const evalues = filteredHits.map(h => h.evalue);
    const minEvalueIndex = evalues.indexOf(Math.min(...evalues));
    const bestEvalue = filteredHits[minEvalueIndex]?.evalueStr || '0';

    // Average Identity
    const avgId = filteredHits.reduce((acc, curr) => acc + curr.identity, 0) / filteredCount;

    // Best Bitscore
    const bestBit = Math.max(...filteredHits.map(h => h.bitscore));

    // Dominant Organism
    const orgCounts: Record<string, number> = {};
    filteredHits.forEach(h => {
      const org = h.organism || 'Inconnu';
      orgCounts[org] = (orgCounts[org] || 0) + 1;
    });
    
    let dominantOrganism = 'Inconnu';
    let maxCount = 0;
    Object.entries(orgCounts).forEach(([org, count]) => {
      if (count > maxCount && org !== 'Inconnu') {
        maxCount = count;
        dominantOrganism = org;
      }
    });

    if (maxCount === 0 && orgCounts['Inconnu'] > 0) {
      dominantOrganism = 'Non spécifié';
    }

    return {
      total,
      filteredCount,
      bestEvalue,
      avgIdentity: `${avgId.toFixed(2)}%`,
      bestBitscore: bestBit,
      dominantOrganism
    };
  }, [parsedResult, filteredHits]);

  // Graph Data 1: Identity distribution
  const identityDistributionData = useMemo(() => {
    if (filteredHits.length === 0) return [];
    const ranges = [
      { name: '<60%', min: 0, max: 60, count: 0 },
      { name: '60-70%', min: 60, max: 70, count: 0 },
      { name: '70-80%', min: 70, max: 80, count: 0 },
      { name: '80-90%', min: 80, max: 90, count: 0 },
      { name: '90-95%', min: 90, max: 95, count: 0 },
      { name: '95-100%', min: 95, max: 101, count: 0 },
    ];

    filteredHits.forEach(h => {
      for (const r of ranges) {
        if (h.identity >= r.min && h.identity < r.max) {
          r.count++;
          break;
        }
      }
    });

    return ranges;
  }, [filteredHits]);

  // Graph Data 2: Correlation Length vs Bit-score
  const correlationData = useMemo(() => {
    return filteredHits.map(h => ({
      name: h.subjectId,
      alignLen: h.alignLen,
      bitscore: h.bitscore,
      evalue: h.evalue,
      organism: h.organism || 'Inconnu'
    }));
  }, [filteredHits]);

  // Graph Data 3: Taxonomy distribution (Top 5 organisms)
  const taxonomyDistributionData = useMemo(() => {
    const orgCounts: Record<string, number> = {};
    filteredHits.forEach(h => {
      const org = h.organism || 'Inconnu';
      orgCounts[org] = (orgCounts[org] || 0) + 1;
    });

    return Object.entries(orgCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredHits]);

  // SVG Packings - NCBI Graphic summary of alignment coverage
  const queryLen = parsedResult?.queryLen || 100;
  
  const packedHits = useMemo(() => {
    if (filteredHits.length === 0) return [];
    
    const tracks: number[] = []; // Stores the right-most end coordinate (1-based) on each track
    
    return filteredHits.map(hit => {
      let trackIndex = 0;
      // Allow 2% padding of the total query length between hits on the same track to keep visual clarity
      const padding = Math.max(1, Math.round(queryLen * 0.02));
      
      while (trackIndex < tracks.length) {
        // If current hit starts after the previous hit on this track plus padding, we can pack it here
        if (hit.qstart > tracks[trackIndex] + padding) {
          break;
        }
        trackIndex++;
      }
      tracks[trackIndex] = Math.max(hit.qend, tracks[trackIndex] || 0);
      
      return {
        hit,
        trackIndex
      };
    });
  }, [filteredHits, queryLen]);

  const maxTrackIndex = useMemo(() => {
    if (packedHits.length === 0) return 0;
    return Math.max(...packedHits.map(ph => ph.trackIndex));
  }, [packedHits]);

  // NCBI style color classification according to Bit Score
  const getBitscoreColor = (score: number) => {
    if (score < 40) return { fill: '#475569', label: 'Noir (<40)' }; // Slate-600
    if (score < 50) return { fill: '#2563EB', label: 'Bleu (40-50)' }; // Blue-600
    if (score < 80) return { fill: '#10B981', label: 'Vert (50-80)' }; // Emerald-500
    if (score < 200) return { fill: '#D946EF', label: 'Magenta (80-200)' }; // Fuchsia-500
    return { fill: '#EF4444', label: 'Rouge (≥200)' }; // Red-500
  };

  // Detailed Alignment formatting helper for the monospace visualization
  const getAlignmentBlocks = (alignment: any, isReverse: boolean) => {
    if (!alignment) return [];
    
    const blocks = [];
    const chunkSize = 60;
    const qseqChars = Array.from(alignment.qseq) as string[];
    const hseqChars = Array.from(alignment.hseq) as string[];
    const midlineChars = Array.from(alignment.midline) as string[];
    
    let currentQ = alignment.qstart;
    let currentS = alignment.sstart;
    
    for (let i = 0; i < qseqChars.length; i += chunkSize) {
      const qseqBlock = qseqChars.slice(i, i + chunkSize);
      const hseqBlock = hseqChars.slice(i, i + chunkSize);
      const midlineBlock = midlineChars.slice(i, i + chunkSize);
      
      // Count actual characters (skipping gaps '-')
      const qNonGaps = qseqBlock.filter(c => c !== '-').length;
      const hNonGaps = hseqBlock.filter(c => c !== '-').length;
      
      // Query coordinates go forward
      const blockQStart = currentQ;
      const blockQEnd = qNonGaps > 0 ? (currentQ + qNonGaps - 1) : currentQ;
      currentQ += qNonGaps;
      
      // Subject coordinates go forward or reverse
      const blockSStart = currentS;
      let blockSEnd = currentS;
      if (isReverse) {
        blockSEnd = hNonGaps > 0 ? (currentS - hNonGaps + 1) : currentS;
        currentS -= hNonGaps;
      } else {
        blockSEnd = hNonGaps > 0 ? (currentS + hNonGaps - 1) : currentS;
        currentS += hNonGaps;
      }
      
      blocks.push({
        qseqBlock,
        hseqBlock,
        midlineBlock,
        qStart: blockQStart,
        qEnd: blockQEnd,
        sStart: blockSStart,
        sEnd: blockSEnd
      });
    }
    
    return blocks;
  };

  const isSelectedReverse = selectedHit ? (selectedHit.sstart > selectedHit.send) : false;
  const alignmentBlocks = useMemo(() => {
    if (!selectedHit || !selectedHit.alignment) return [];
    return getAlignmentBlocks(selectedHit.alignment, isSelectedReverse);
  }, [selectedHit, isSelectedReverse]);

  // Printer-friendly preview trigger
  const handlePrint = () => {
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      
      {/* SECTION 1: SYSTEM TOP BAR CONTRACT (Strict 3-zone architecture) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0E17] shrink-0 sticky top-0 z-40 shadow-sm">
        {/* Zone 1: Brand Title (One line, character display) */}
        <div className="flex items-center gap-3">
          <Dna className="h-6 w-6 text-cyan-400 animate-pulse" />
          <h1 className="text-lg font-semibold tracking-tight text-white font-mono">
            BLAST <span className="text-cyan-400 font-bold">BioParser</span>
          </h1>
        </div>

        {/* Zone 2: Navigation Links / Fast Switchers (Single line unboxed) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`hover:text-white transition-colors py-1 relative ${activeTab === 'stats' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''}`}
          >
            Statistiques & Table
          </button>
          <button 
            onClick={() => setActiveTab('alignments')}
            className={`hover:text-white transition-colors py-1 relative ${activeTab === 'alignments' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''}`}
          >
            Alignement Pairwise & SVG
          </button>
        </nav>

        {/* Zone 3: Primary Actions (CSV export & Paste modal buttons) */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setShowRawInput(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            Importer Séquence
          </button>
          <button 
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors whitespace-nowrap shadow-md shadow-cyan-900/45"
          >
            <Printer className="h-3.5 w-3.5" />
            Rapport PDF
          </button>
        </div>
      </header>

      {/* SYSTEM TELEMETRY STRIP (State Indicator) */}
      <div className="bg-[#0e1420] border-b border-slate-800 px-6 py-2 text-xs font-mono flex flex-wrap justify-between items-center text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/25"></span>
          <span className="text-emerald-400 uppercase tracking-wider font-bold">● PARSER ACTIF</span>
          <span className="text-slate-600">|</span>
          <span>PROGRAMME: <span className="text-cyan-400 font-bold uppercase">{parsedResult?.program || 'N/A'}</span></span>
          <span className="text-slate-600">|</span>
          <span className="truncate max-w-[250px] lg:max-w-[450px]">
            REQUÊTE: <span className="text-slate-200">{parsedResult?.queryDef || 'Inconnue'}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>BASE DE DONNÉES: <span className="text-amber-400 font-semibold">{parsedResult?.database || 'Inconnue'}</span></span>
          {parsedResult?.queryLen && (
            <>
              <span className="text-slate-600">|</span>
              <span>TAILLE REQUÊTE: <span className="text-slate-200 font-bold">{parsedResult.queryLen} aa/pb</span></span>
            </>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT: Split Console (Asymmetric design) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: Controls, Filters & File Management (340px width) */}
        <aside className="w-full lg:w-[350px] bg-[#090D14] border-r border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
          
          {/* Section A: Selection d'échantillons préchargés */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 font-bold">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              Jeux de Données Réels
            </h3>
            <div className="flex flex-col gap-2">
              {SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(idx)}
                  className={`w-full text-left p-3 rounded border transition-all text-xs flex flex-col gap-1.5 ${
                    activeSampleIndex === idx 
                      ? 'bg-cyan-950/40 border-cyan-500/80 text-white ring-1 ring-cyan-500/40' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-100 truncate max-w-[190px]">{sample.name}</span>
                    <span className="font-mono text-[10px] text-cyan-400 whitespace-nowrap bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800/60">
                      {sample.type.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <hr className="border-slate-800" />

          {/* Section B: Filtres Interactifs Dynamiques */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 font-bold">
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                Filtres Dynamiques
              </h3>
              {(filterQuery || filterIdentity > 0 || filterCoverage > 0 || filterEvaluePower < 0 || filterMinBitscore > 0 || filterMinLength > 0) && (
                <button 
                  onClick={handleResetFilters}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors font-mono uppercase flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Sub-Filter 1: Recherche Textuelle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">Recherche Organisme / ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Ex: Escherichia, P68871..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-3 py-1.5 pl-8 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            {/* Sub-Filter 2: E-Value Threshold (Negative Exponent) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Seuil de E-Value</span>
                <span className="text-cyan-400 font-bold">
                  {filterEvaluePower === 0 ? "Tous (≤ 1.0)" : `≤ 10^(${filterEvaluePower})`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="0"
                step="1"
                value={filterEvaluePower}
                onChange={(e) => setFilterEvaluePower(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10⁻¹⁰⁰</span>
                <span>10⁻⁵⁰</span>
                <span>Toutes</span>
              </div>
            </div>

            {/* Sub-Filter 3: Pourcentage d'identité minimale */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Identité Minimale</span>
                <span className="text-cyan-400 font-bold">{filterIdentity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={filterIdentity}
                onChange={(e) => setFilterIdentity(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Sub-Filter 4: Couverture minimale de la requête */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Couverture Minimale</span>
                <span className="text-cyan-400 font-bold">{filterCoverage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={filterCoverage}
                onChange={(e) => setFilterCoverage(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Sub-Filter 5: Score binaire minimum */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Score Binaire (Bits)</span>
                <span className="text-cyan-400 font-bold">≥ {filterMinBitscore}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxValues.bitscore}
                step={Math.ceil(maxValues.bitscore / 50) || 1}
                value={filterMinBitscore}
                onChange={(e) => setFilterMinBitscore(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>{Math.round(maxValues.bitscore / 2)}</span>
                <span>{maxValues.bitscore}</span>
              </div>
            </div>

            {/* Sub-Filter 6: Longueur minimale alignement */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Longueur Min Alignement</span>
                <span className="text-cyan-400 font-bold">≥ {filterMinLength} pb/aa</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxValues.length}
                step={Math.ceil(maxValues.length / 50) || 1}
                value={filterMinLength}
                onChange={(e) => setFilterMinLength(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>{Math.round(maxValues.length / 2)}</span>
                <span>{maxValues.length}</span>
              </div>
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Exporter les hits filtrés ({filteredHits.length})</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleExportData('csv')}
                disabled={filteredHits.length === 0}
                className="px-2 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                CSV
              </button>
              <button
                onClick={() => handleExportData('tsv')}
                disabled={filteredHits.length === 0}
                className="px-2 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                TSV
              </button>
              <button
                onClick={() => handleExportData('json')}
                disabled={filteredHits.length === 0}
                className="px-2 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                JSON
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Results Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#07090E]">
          
          {/* Status Message Banners */}
          {successMessage && (
            <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 px-6 py-2.5 text-xs flex items-center gap-2 font-mono">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
          {fileError && (
            <div className="bg-rose-950/80 border-b border-rose-500/40 text-rose-300 px-6 py-2.5 text-xs flex items-center gap-2 font-mono">
              <span className="font-bold text-rose-400">✖ ERREUR:</span>
              <span>{fileError}</span>
            </div>
          )}

          {/* KPI BOARD SUMMARY */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 border-b border-slate-800 bg-[#090D14]/50">
            {/* KPI 1 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Total des Hits</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">{stats.total}</span>
                <span className="text-[10px] uppercase font-mono text-slate-500">bruts</span>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Hits Retenus</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">{stats.filteredCount}</span>
                <span className="text-[10px] uppercase font-mono text-cyan-500">filtrés</span>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Meilleur E-Value</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-mono font-semibold text-emerald-400 truncate max-w-full" title={stats.bestEvalue}>
                  {stats.bestEvalue}
                </span>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Identité Moyenne</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">{stats.avgIdentity}</span>
              </div>
            </div>
            {/* KPI 5 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Meilleur Bit-Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-white tabular-nums">{stats.bestBitscore}</span>
                <span className="text-[10px] uppercase font-mono text-slate-500">bits</span>
              </div>
            </div>
            {/* KPI 6 */}
            <div className="border border-slate-800 rounded bg-[#0b0f19] p-3.5 flex flex-col gap-1">
              <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono">Organisme Dominant</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-slate-200 truncate max-w-full" title={stats.dominantOrganism}>
                  {stats.dominantOrganism}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW SWITCHER TABS FOR MOBILE */}
          <div className="md:hidden flex border-b border-slate-800 bg-[#090D14]">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 text-center py-3 text-xs font-mono tracking-wider ${activeTab === 'stats' ? 'bg-[#07090E] text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-slate-400'}`}
            >
              STATISTIQUES & TABLE
            </button>
            <button 
              onClick={() => setActiveTab('alignments')}
              className={`flex-1 text-center py-3 text-xs font-mono tracking-wider ${activeTab === 'alignments' ? 'bg-[#07090E] text-cyan-400 font-bold border-b-2 border-cyan-400' : 'text-slate-400'}`}
            >
              ALIGNEMENTS & SVG
            </button>
          </div>

          {/* TAB CONTENT 1: STATS & DATA TABLE */}
          {(activeTab === 'stats' || window.innerWidth >= 768) && (
            <div className={`p-6 flex flex-col gap-8 ${activeTab !== 'stats' ? 'hidden md:flex' : ''}`}>
              
              {/* SECTION: GRAPHICS ROW (Dual or Triple chart layout) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Chart 1: Distribution of Sequence Identity */}
                <div className="border border-slate-800 rounded-lg bg-[#090D14] p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-cyan-400" />
                      Distribution de l'Identité (%)
                    </h4>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={identityDistributionData} 
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontStyle="italic" />
                        <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                        <ChartTooltip 
                          contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '4px' }}
                          labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 'bold' }}
                          itemStyle={{ color: '#06B6D4' }}
                          formatter={(value: any) => [`${value} hit(s)`, 'Nombre de hits']}
                        />
                        <Bar dataKey="count" fill="#06B6D4" radius={[2, 2, 0, 0]} maxBarSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Correlation Plot (Length vs Bit-score) */}
                <div className="border border-slate-800 rounded-lg bg-[#090D14] p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      Corrélation : Longueur vs Bit-score
                    </h4>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis 
                          type="number" 
                          dataKey="alignLen" 
                          name="Longueur align." 
                          stroke="#64748B" 
                          fontSize={11} 
                          unit=" aa/pb" 
                        />
                        <YAxis 
                          type="number" 
                          dataKey="bitscore" 
                          name="Bit-score" 
                          stroke="#64748B" 
                          fontSize={11} 
                          unit=" bits" 
                        />
                        <ZAxis type="number" range={[50, 200]} />
                        <ChartTooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0B0F19] border border-[#1E293B] p-3 rounded text-xs font-mono flex flex-col gap-1">
                                  <span className="text-white font-bold">{data.name}</span>
                                  <span className="text-slate-400 truncate max-w-[200px]">{data.organism}</span>
                                  <div className="border-t border-slate-800 my-1 pt-1 flex flex-col gap-0.5 text-cyan-400">
                                    <span>Longueur : <span className="text-slate-200">{data.alignLen} pb/aa</span></span>
                                    <span>Bit-score : <span className="text-slate-200">{data.bitscore}</span></span>
                                    <span>E-value : <span className="text-amber-400">{data.evalue.toExponential(2)}</span></span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter name="Hits Alignés" data={correlationData} fill="#8B5CF6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Taxonomic Distribution (Organisms) */}
                <div className="border border-slate-800 rounded-lg bg-[#090D14] p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      Répartition Taxonomique (Top 5)
                    </h4>
                  </div>
                  {taxonomyDistributionData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic">
                      Aucune donnée taxonomique disponible
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={taxonomyDistributionData} 
                          layout="vertical"
                          margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                          <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            stroke="#64748B" 
                            fontSize={10} 
                            width={110} 
                            tickFormatter={(v) => v.length > 15 ? `${v.substring(0, 13)}...` : v}
                          />
                          <ChartTooltip 
                            contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '4px' }}
                            labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 'bold' }}
                            itemStyle={{ color: '#10B981' }}
                            formatter={(value: any) => [`${value} alignement(s)`, 'Occurrences']}
                          />
                          <Bar dataKey="count" fill="#10B981" radius={[0, 2, 2, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

              </div>

              {/* TABLE INTERACTIVE DES HITS */}
              <div className="border border-slate-800 rounded-lg bg-[#090D14] overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-800 bg-[#0B0F19] flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      Liste des Alignements Filtrés
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Séquences ordonnées et filtrées en temps réel. Cliquez sur une ligne pour l'inspecter.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Hits affichés : <span className="text-cyan-400 font-bold">{filteredHits.length}</span> / {parsedResult?.hits.length || 0}
                  </div>
                </div>

                {filteredHits.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-mono text-sm">
                    ✖ Aucun hit ne correspond aux filtres actuels. Modifiez vos curseurs ou votre recherche.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs text-slate-300">
                      <thead>
                        <tr className="bg-[#0b101c]/70 text-slate-400 border-b border-slate-800 select-none">
                          <th className="py-3 px-4 text-[11px] font-bold">Actions</th>
                          <th onClick={() => handleSort('queryId')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors">
                            Query ID {sortField === 'queryId' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('subjectId')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors">
                            Sujet ID (Accession) {sortField === 'subjectId' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('organism')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors">
                            Espèce / Organisme {sortField === 'organism' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('identity')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            % Identité {sortField === 'identity' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('alignLen')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            Long. Align {sortField === 'alignLen' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('mismatches')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            Mism. {sortField === 'mismatches' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('gaps')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            Gaps {sortField === 'gaps' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('evalue')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            E-value {sortField === 'evalue' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('bitscore')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            Bit-Score {sortField === 'bitscore' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                          <th onClick={() => handleSort('queryCoverage')} className="py-3 px-4 text-[11px] font-bold cursor-pointer hover:bg-slate-800 hover:text-white transition-colors text-right">
                            Couverture {sortField === 'queryCoverage' && (sortDirection === 'asc' ? '▲' : '▼')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {paginatedHits.map((hit) => {
                          const isSelected = selectedHitId === hit.id;
                          return (
                            <tr 
                              key={hit.id}
                              onClick={() => {
                                setSelectedHitId(hit.id);
                                // Scroll or redirect to pairwise view on small devices if they tap
                                if (window.innerWidth < 768) {
                                  setActiveTab('alignments');
                                }
                              }}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-cyan-950/20 text-white font-semibold border-l-2 border-l-cyan-400' 
                                  : 'hover:bg-slate-800/40 text-slate-300'
                              }`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHitId(hit.id);
                                    setActiveTab('alignments');
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5"
                                >
                                  Inspecter <ChevronRight className="h-3 w-3" />
                                </button>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-100 truncate max-w-[120px]" title={hit.queryId}>
                                {hit.queryId}
                              </td>
                              <td className="py-3 px-4 text-cyan-300 font-mono truncate max-w-[150px]" title={hit.subjectId}>
                                {hit.subjectId}
                              </td>
                              <td className="py-3 px-4 italic text-slate-400 truncate max-w-[180px]" title={hit.organism || 'Inconnu'}>
                                {hit.organism || 'Inconnu'}
                              </td>
                              <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-400">
                                {hit.identity.toFixed(2)}%
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums">{hit.alignLen}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-rose-400">{hit.mismatches}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-amber-500">{hit.gaps}</td>
                              <td className="py-3 px-4 text-right font-semibold tabular-nums text-amber-400">
                                {hit.evalueStr}
                              </td>
                              <td className="py-3 px-4 text-right font-bold tabular-nums text-white">
                                {hit.bitscore}
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums">
                                {hit.queryCoverage ? `${hit.queryCoverage.toFixed(1)}%` : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGINATION CONTROLS */}
                {filteredHits.length > 0 && (
                  <div className="px-5 py-4 border-t border-slate-800 bg-[#0B0F19] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
                    <div className="text-slate-500">
                      Affichage de <span className="text-slate-300 font-bold">{(currentPage - 1) * rowsPerPage + 1}</span> à <span className="text-slate-300 font-bold">{Math.min(currentPage * rowsPerPage, filteredHits.length)}</span> sur <span className="text-cyan-400 font-bold">{filteredHits.length}</span> hits
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span>Lignes :</span>
                        <select 
                          value={rowsPerPage} 
                          onChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded focus:outline-none"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                        >
                          Précédent
                        </button>
                        <span className="px-3 text-slate-400">
                          {currentPage} / {totalPages || 1}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT 2: GRAPHICAL COVERAGE SVG MAP & PAIRWISE INSPECTOR */}
          {(activeTab === 'alignments' || window.innerWidth >= 768) && (
            <div className={`p-6 flex flex-col gap-8 ${activeTab !== 'alignments' ? 'hidden md:flex' : ''}`}>
              
              {/* NCBI STYLE GRAPHIC SUMMARY (SVG Coverage Map) */}
              <div className="border border-slate-800 rounded-lg bg-[#090D14] p-5 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    Carte Graphique de Couverture (SVG - Style NCBI)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Position relative des hits alignés sur la séquence requête. Survolez pour voir l'infobulle, cliquez pour sélectionner.
                  </p>
                </div>

                {/* NCBI Color Classification Legend */}
                <div className="flex flex-wrap gap-4 p-2.5 rounded bg-[#0B0F19] border border-slate-800 text-[11px] font-mono justify-center sm:justify-start">
                  <span className="text-slate-400 font-bold">Légende Bit-Score :</span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-5 rounded bg-slate-600"></span>
                    <span>&lt; 40</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-5 rounded bg-blue-600"></span>
                    <span>40-50</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-5 rounded bg-emerald-500"></span>
                    <span>50-80</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-5 rounded bg-fuchsia-500"></span>
                    <span>80-200</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-5 rounded bg-red-500"></span>
                    <span>≥ 200</span>
                  </div>
                </div>

                {filteredHits.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-mono text-xs italic">
                    Aucun alignement disponible pour affichage graphique
                  </div>
                ) : (
                  <div className="relative overflow-x-auto pb-2">
                    <div className="min-w-[650px] bg-[#07090E] rounded border border-slate-850 p-4">
                      
                      {/* SVG Canvas */}
                      <svg 
                        width="100%" 
                        height={Math.max(160, 80 + (maxTrackIndex + 1) * 16)} 
                        viewBox={`0 0 800 ${Math.max(160, 80 + (maxTrackIndex + 1) * 16)}`}
                        className="overflow-visible select-none"
                      >
                        {/* Background grid markings */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                          <line
                            key={i}
                            x1={80 + pct * 680}
                            y1={15}
                            x2={80 + pct * 680}
                            y2={Math.max(160, 60 + (maxTrackIndex + 1) * 16)}
                            stroke="#1E293B"
                            strokeWidth={1}
                            strokeDasharray="2 4"
                          />
                        ))}

                        {/* Query Label and Ruler Bar */}
                        <text x={10} y={35} fill="#94A3B8" className="font-mono text-xs font-bold">Requête</text>
                        <rect x={80} y={25} width={680} height={12} fill="#1E293B" rx={3} />
                        <rect x={80} y={25} width={680} height={12} fill="url(#queryGrad)" rx={3} opacity={0.3} />
                        
                        {/* Tick Marks for Query sequence lengths */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                          const tickVal = Math.round(pct * queryLen) || 1;
                          return (
                            <g key={i} className="font-mono text-[9px] fill-slate-500 text-center">
                              <line x1={80 + pct * 680} y1={37} x2={80 + pct * 680} y2={42} stroke="#475569" strokeWidth={1} />
                              <text x={80 + pct * 680} y={51} textAnchor="middle" fill="#64748B">{tickVal} pb/aa</text>
                            </g>
                          );
                        })}

                        {/* Subject Alignment Tracks */}
                        {packedHits.map(({ hit, trackIndex }) => {
                          const startPct = (hit.qstart - 1) / queryLen;
                          const endPct = hit.qend / queryLen;
                          
                          // Calculate precise coordinates on SVG (from x=80 to x=760, width = 680)
                          const x = 80 + startPct * 680;
                          const rawWidth = (endPct - startPct) * 680;
                          const width = Math.max(3, rawWidth); // Minimum 3px so it is visible even if tiny
                          const y = 70 + trackIndex * 16;
                          
                          const color = getBitscoreColor(hit.bitscore).fill;
                          const isSelected = selectedHitId === hit.id;
                          const isHovered = hoveredHitId === hit.id;

                          return (
                            <g 
                              key={hit.id}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredHitId(hit.id)}
                              onMouseLeave={() => setHoveredHitId(null)}
                              onClick={() => setSelectedHitId(hit.id)}
                            >
                              {/* Invisible larger hover zone for better UX */}
                              <rect 
                                x={x - 2} 
                                y={y - 4} 
                                width={width + 4} 
                                height={18} 
                                fill="transparent" 
                              />
                              
                              {/* Actual graphic bar */}
                              <rect
                                x={x}
                                y={y}
                                width={width}
                                height={10}
                                fill={color}
                                rx={2}
                                className="transition-all duration-150"
                                stroke={isSelected ? '#06B6D4' : 'transparent'}
                                strokeWidth={isSelected ? 1.5 : 0}
                                opacity={isHovered || isSelected ? 1.0 : 0.75}
                              />
                            </g>
                          );
                        })}

                        {/* Gradient definitions */}
                        <defs>
                          <linearGradient id="queryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06B6D4" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Simulated Interactive SVG Tooltip in HTML for absolute rendering safety */}
                      <div className="h-10 mt-3 flex items-center justify-between px-3 py-2 bg-[#0B0F19] rounded border border-slate-800 text-xs font-mono">
                        {hoveredHitId ? (() => {
                          const hit = filteredHits.find(h => h.id === hoveredHitId);
                          if (!hit) return null;
                          return (
                            <div className="flex justify-between w-full items-center">
                              <div>
                                <span className="text-cyan-400 font-bold font-mono">{hit.subjectId}</span>
                                <span className="text-slate-400 ml-2">[{hit.organism}]</span>
                              </div>
                              <div className="flex gap-4 text-slate-300">
                                <span>Coordonnées : <span className="text-white">{hit.qstart}..{hit.qend}</span></span>
                                <span>Identité : <span className="text-emerald-400 font-bold">{hit.identity.toFixed(1)}%</span></span>
                                <span>Bit-Score : <span className="text-white font-bold">{hit.bitscore}</span></span>
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-slate-500 italic">Survolez un segment de couleur pour examiner ses statistiques d'alignement rapides.</span>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* DETAIL PAIRWISE ALIGNMENT INSPECTOR */}
              <div className="border border-slate-800 rounded-lg bg-[#090D14] overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-800 bg-[#0B0F19] flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      Inspecteur d'Alignement Détaillé
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Séquençage par paires montrant les mutations, transitions et brèches (gaps).
                    </p>
                  </div>
                  {selectedHit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyAlignment(selectedHit)}
                        className="px-2.5 py-1.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                        title="Copier le bloc d'alignement entier"
                      >
                        <Clipboard className="h-3 w-3 text-cyan-400" />
                        Copier l'alignement
                      </button>
                      <button
                        onClick={() => handleCopySubjectSeq(selectedHit)}
                        className="px-2.5 py-1.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                        title="Copier la séquence sujet brute"
                      >
                        <Check className={`h-3 w-3 ${copySuccess ? 'text-emerald-400' : 'text-cyan-400'}`} />
                        Copier Séquence Sujet
                      </button>
                    </div>
                  )}
                </div>

                {selectedHit ? (
                  <div className="p-6 flex flex-col gap-5">
                    
                    {/* Selected Hit Metadata Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded bg-[#0B0F19] border border-slate-850 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">Identifiant Sujet</span>
                        <span className="text-cyan-300 font-bold text-sm block mt-0.5 truncate">{selectedHit.subjectId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[10px]">Organisme / Espèce</span>
                        <span className="text-slate-200 block mt-0.5 font-bold truncate">{selectedHit.organism || 'Non spécifié'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">% Identité</span>
                          <span className="text-emerald-400 font-bold block mt-0.5">{selectedHit.identity.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Brèches (Gaps)</span>
                          <span className="text-amber-500 font-bold block mt-0.5">{selectedHit.gaps}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">E-Value</span>
                          <span className="text-amber-400 font-bold block mt-0.5">{selectedHit.evalueStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[10px]">Bit-Score</span>
                          <span className="text-white font-bold block mt-0.5">{selectedHit.bitscore} bits</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800 text-[11px] font-mono flex items-center gap-4 text-slate-400">
                      <span className="text-cyan-400 font-bold">Légende :</span>
                      <div className="flex items-center gap-1">
                        <span className="px-1 py-0.5 rounded text-rose-400 bg-rose-500/20">A</span>
                        <span>Mésappariement (Mismatch)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1 py-0.5 rounded text-amber-400 bg-amber-500/20">-</span>
                        <span>Insertion/Brèche (Gap)</span>
                      </div>
                    </div>

                    {/* Sequential Alignment blocks */}
                    <div className="p-5 rounded bg-slate-950 border border-slate-900 flex flex-col gap-6 max-h-[450px] overflow-y-auto custom-scrollbar">
                      {alignmentBlocks.length > 0 ? (
                        alignmentBlocks.map((block, bIdx) => (
                          <div key={bIdx} className="grid grid-cols-[auto_1fr_auto] gap-x-4 font-mono text-sm leading-relaxed overflow-x-auto pb-4 border-b border-slate-900/60 last:border-b-0">
                            
                            {/* Query sequence line */}
                            <div className="text-slate-500 select-none">Query  {block.qStart.toString().padEnd(6)}</div>
                            <div className="tracking-widest font-bold">
                              {block.qseqBlock.map((char, idx) => {
                                const isGap = char === '-' || block.hseqBlock[idx] === '-';
                                const isMismatch = char !== block.hseqBlock[idx] && !isGap;
                                return (
                                  <span 
                                    key={idx} 
                                    className={
                                      isGap 
                                        ? 'text-amber-400 bg-amber-500/20 px-0.5' 
                                        : isMismatch 
                                          ? 'text-rose-400 bg-rose-500/20 px-0.5' 
                                          : 'text-slate-300'
                                    }
                                  >
                                    {char}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="text-slate-500 select-none">{block.qEnd}</div>

                            {/* Consensus Midline line */}
                            <div className="text-slate-500 select-none"></div>
                            <div className="tracking-widest text-emerald-500/80 whitespace-pre">
                              {block.midlineBlock.join('')}
                            </div>
                            <div className="text-slate-500 select-none"></div>

                            {/* Subject sequence line */}
                            <div className="text-slate-500 select-none">Sbjct  {block.sStart.toString().padEnd(6)}</div>
                            <div className="tracking-widest font-bold">
                              {block.hseqBlock.map((char, idx) => {
                                const isGap = char === '-' || block.qseqBlock[idx] === '-';
                                const isMismatch = char !== block.qseqBlock[idx] && !isGap;
                                return (
                                  <span 
                                    key={idx} 
                                    className={
                                      isGap 
                                        ? 'text-amber-400 bg-amber-500/20 px-0.5' 
                                        : isMismatch 
                                          ? 'text-rose-400 bg-rose-500/20 px-0.5' 
                                          : 'text-slate-300'
                                    }
                                  >
                                    {char}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="text-slate-500 select-none">{block.sEnd}</div>
                            
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-center py-6 text-xs">
                          Aucune donnée de séquence disponible pour cet alignement.
                        </div>
                      )}
                    </div>

                    <div className="text-slate-500 text-[10px] font-mono italic">
                      Note : Si vous avez importé un fichier tabulaire sans séquences brutes, un alignement stochastique à haute fidélité est généré automatiquement d'après les scores de mésappariement et de gaps.
                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 font-mono text-sm">
                    Sélectionnez un alignement pour inspecter sa séquence par paires.
                  </div>
                )}
              </div>

            </div>
          )}

        </main>

      </div>

      {/* MODAL 1: IMPORTER SÉQUENCE / BLAST TEXT */}
      {showRawInput && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-lg max-w-3xl w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" />
                Importer de Nouveaux Résultats BLAST
              </h3>
              <button 
                onClick={() => setShowRawInput(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                [Fermer]
              </button>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-800 rounded-lg p-5 text-center bg-slate-950/50 hover:border-cyan-500/50 transition-colors cursor-pointer group"
            >
              <Upload className="h-8 w-8 mx-auto text-slate-600 group-hover:text-cyan-400 transition-colors mb-2" />
              <p className="text-xs text-slate-300 font-semibold">
                Glissez-déposez votre fichier ici, ou cliquez pour parcourir
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Fichiers supportés : .xml, .tsv, .txt, .blast (XML outfmt 5, Tabulaire outfmt 6/7, Texte outfmt 0)
              </p>
              <input
                type="file"
                accept=".txt,.tsv,.xml,.blast,.tab"
                onChange={handleFileChange}
                className="hidden"
                id="file-input-trigger"
              />
              <label 
                htmlFor="file-input-trigger"
                className="inline-block mt-3 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded text-[11px] font-mono text-cyan-400 hover:bg-slate-800 cursor-pointer"
              >
                Sélectionner un Fichier
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Ou collez le texte brut ci-dessous :</span>
                <button 
                  onClick={handlePasteText}
                  className="text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  Coller depuis le presse-papiers
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setActiveSampleIndex(-1);
                }}
                rows={8}
                placeholder="Collez ici les résultats tabulaires, XML ou texte standard..."
                className="w-full bg-slate-950 border border-slate-850 rounded p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRawText('');
                  setActiveSampleIndex(-1);
                }}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white"
              >
                Vider
              </button>
              <button
                onClick={() => {
                  setShowRawInput(false);
                  setSuccessMessage("Résultats mis à jour.");
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
                className="px-4 py-1.5 text-xs font-mono rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                Valider & Analyser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINT REPORT PREVIEW & CONFIGURATION */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-lg max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <Printer className="h-4 w-4 text-cyan-400" />
                Générer un Rapport d'Analyse Scientifique
              </h3>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                [Annuler]
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Le visualiseur va lancer l'utilitaire d'impression de votre navigateur. Pour un résultat optimal :
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-400 flex flex-col gap-1.5">
              <li>Activez l'option <strong className="text-slate-200">"Imprimer les graphiques d'arrière-plan"</strong> dans les options d'impression.</li>
              <li>Configurez l'orientation sur <strong className="text-slate-200">"Paysage"</strong> ou <strong className="text-slate-200">"Portrait"</strong> selon vos préférences de mise en page.</li>
              <li>Vous pouvez choisir d'enregistrer le document directement au format <strong className="text-slate-200">PDF</strong>.</li>
            </ul>

            <div className="p-3.5 rounded bg-slate-950/60 border border-slate-850 flex flex-col gap-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Résumé du Rapport :</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono text-slate-300">
                <div>Programme : <span className="text-cyan-400 font-bold uppercase">{parsedResult?.program || 'Inconnu'}</span></div>
                <div>Hits Identifiés : <span className="text-white font-bold">{filteredHits.length} / {parsedResult?.hits.length || 0}</span></div>
                <div>Identité Moyenne : <span className="text-emerald-400 font-bold">{stats.avgIdentity}</span></div>
                <div>Meilleur Bit-Score : <span className="text-white font-bold">{stats.bestBitscore} bits</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-1.5 text-xs font-mono font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-md shadow-cyan-900/50"
              >
                <Printer className="h-4 w-4" />
                Imprimer / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY EMBEDDED STYLESHEET AND MARKUP CONTAINER */}
      <div className="hidden print:block absolute inset-0 bg-white text-slate-900 p-8 font-sans z-[99999]">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body, html {
              background-color: white !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            .no-print { display: none !important; }
            header, footer, aside, .tab-buttons, button, .modal, .telemetry { display: none !important; }
            .print-card {
              border: 1px solid #cbd5e1 !important;
              border-radius: 6px !important;
              padding: 16px !important;
              margin-bottom: 20px !important;
              page-break-inside: avoid;
              background-color: #f8fafc !important;
            }
            .print-header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .print-grid {
              display: grid;
              grid-template-cols: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 24px;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              font-size: 10px;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              border-bottom: 2px solid #94a3b8 !important;
              padding: 8px !important;
              font-weight: bold;
              text-align: left;
            }
            .print-table td {
              border-bottom: 1px solid #e2e8f0 !important;
              padding: 6px 8px !important;
            }
          }
        `}} />
        
        {/* Printable Document Header */}
        <div className="print-header flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">RAPPORT D'ANALYSE BLAST</h1>
            <p className="text-xs text-slate-500 font-mono mt-1">Généré le {new Date().toLocaleDateString('fr-FR')} par BLAST BioParser</p>
          </div>
          <div className="text-right text-xs font-mono">
            <p><strong>Programme:</strong> {parsedResult?.program.toUpperCase() || 'N/A'}</p>
            <p><strong>Base de données:</strong> {parsedResult?.database || 'N/A'}</p>
          </div>
        </div>

        {/* Query Summary Box */}
        <div className="print-card mb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Informations Générales de Séquence Requête</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><strong>Nom/Définition de la Requête:</strong> {parsedResult?.queryDef || 'Non spécifié'}</div>
            <div><strong>Taille de Séquence:</strong> {parsedResult?.queryLen || 'N/A'} pb/aa</div>
            <div><strong>Nombre Total de Hits BLAST:</strong> {parsedResult?.hits.length || 0}</div>
            <div><strong>Nombre de Hits Retenus après Filtrage:</strong> {filteredHits.length}</div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="print-grid">
          <div className="border border-slate-300 rounded p-3 bg-slate-50">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Identité Moyenne</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.avgIdentity}</span>
          </div>
          <div className="border border-slate-300 rounded p-3 bg-slate-50">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Meilleur E-Value</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.bestEvalue}</span>
          </div>
          <div className="border border-slate-300 rounded p-3 bg-slate-50">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">Meilleur Bit-Score</span>
            <span className="text-xl font-bold text-slate-900 font-mono">{stats.bestBitscore} bits</span>
          </div>
        </div>

        {/* Taxonomic Distribution section (for printed report) */}
        <div className="print-card">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Principaux Taxons / Espèces Représentés</h2>
          <div className="grid grid-cols-5 gap-3">
            {taxonomyDistributionData.map((t, idx) => (
              <div key={idx} className="border border-slate-200 rounded p-2 bg-white text-center">
                <span className="text-[10px] font-bold block text-slate-700 truncate" title={t.name}>{t.name}</span>
                <span className="text-sm font-bold text-cyan-700 font-mono block mt-1">{t.count} hits</span>
              </div>
            ))}
          </div>
        </div>

        {/* Printable hits table */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Liste des Alignements Significatifs Retenus ({filteredHits.length})</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Sujet ID (Accession)</th>
                <th>Organisme</th>
                <th style={{ textAlign: 'right' }}>% Identité</th>
                <th style={{ textAlign: 'right' }}>Long. Align</th>
                <th style={{ textAlign: 'right' }}>Mismatches</th>
                <th style={{ textAlign: 'right' }}>Gaps</th>
                <th style={{ textAlign: 'right' }}>E-Value</th>
                <th style={{ textAlign: 'right' }}>Bit-Score</th>
                <th style={{ textAlign: 'right' }}>Couverture</th>
              </tr>
            </thead>
            <tbody>
              {filteredHits.slice(0, 25).map((hit, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold' }}>{hit.subjectId}</td>
                  <td style={{ fontStyle: 'italic' }}>{hit.organism || 'Inconnu'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{hit.identity.toFixed(2)}%</td>
                  <td style={{ textAlign: 'right' }}>{hit.alignLen}</td>
                  <td style={{ textAlign: 'right' }}>{hit.mismatches}</td>
                  <td style={{ textAlign: 'right' }}>{hit.gaps}</td>
                  <td style={{ textAlign: 'right', color: '#b45309' }}>{hit.evalueStr}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{hit.bitscore}</td>
                  <td style={{ textAlign: 'right' }}>{hit.queryCoverage ? `${hit.queryCoverage.toFixed(1)}%` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHits.length > 25 && (
            <p className="text-[10px] text-slate-400 italic mt-3 text-center">
              * Ce rapport a été tronqué aux 25 premiers hits significatifs pour l'impression de la table principale. Le fichier brut complet en contient {filteredHits.length}.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
