export interface SampleDataset {
  name: string;
  type: string;
  description: string;
  format: 'tabular' | 'xml' | 'text';
  content: string;
}

export const SAMPLES: SampleDataset[] = [
  {
    name: "Blastn - ARN ribosomal 16S (Tabulaire Outfmt 7)",
    type: "Blastn (Nucléotides)",
    description: "Recherche de taxonomie bactérienne d'une séquence de 1500 pb d'ARN ribosomal 16S contre la base de données RefSeq 16S Microbial.",
    format: "tabular",
    content: `# BLASTN 2.13.0+
# Query: 16S_rRNA_Escherichia_coli_MG1655 Length=1542
# Database: RefSeq_16S_Microbial
# Fields: query id, subject id, % identity, alignment length, mismatches, gap opens, q. start, q. end, s. start, s. end, evalue, bit score
16S_rRNA_E_coli	NR_114042.1	100.00	1542	0	0	1	1542	1	1542	0.0	2848
16S_rRNA_E_coli	NR_024570.1	99.35	1542	10	0	1	1542	1	1542	0.0	2801
16S_rRNA_E_coli	NR_112007.1	98.90	1542	17	0	1	1542	1	1542	0.0	2740
16S_rRNA_E_coli	NR_074902.1	97.47	1538	34	5	1	1538	5	1538	0.0	2512
16S_rRNA_E_coli	NR_115194.1	95.12	1540	70	5	5	1542	10	1544	0.0	2110
16S_rRNA_E_coli	NR_040843.1	92.30	1545	110	9	1	1540	2	1542	2e-160	1800
16S_rRNA_E_coli	NR_104245.1	89.50	1530	150	11	15	1540	1	1525	1e-124	1430
16S_rRNA_E_coli	NR_026342.1	84.10	1520	210	15	40	1542	20	1520	4e-72	950
16S_rRNA_E_coli	NR_044521.1	78.40	1490	290	20	50	1520	45	1515	1e-35	520
`
  },
  {
    name: "Blastp - Hémoglobine Bêta contre SwissProt (XML Outfmt 5)",
    type: "Blastp (Protéines)",
    description: "Alignement de l'Hémoglobine sous-unité bêta humaine de 147 résidus (HBB) contre SwissProt pour identifier les orthologues chez les mammifères.",
    format: "xml",
    content: `<?xml version="1.0"?>
<!DOCTYPE BlastOutput PUBLIC "-//NCBI//NCBI BlastOutput/EN" "http://www.ncbi.nlm.nih.gov/dtd/NCBI_BlastOutput.dtd">
<BlastOutput>
  <BlastOutput_program>blastp</BlastOutput_program>
  <BlastOutput_version>BLASTP 2.12.0+</BlastOutput_version>
  <BlastOutput_reference>Stephen F. Altschul, Thomas L. Madden, Alejandro A. Sch&amp;auml;ffer, Jinghui Zhang, Zheng Zhang, Webb Miller, and David J. Lipman (1997), "Gapped BLAST and PSI-BLAST: a new generation of protein database search programs", Nucleic Acids Res. 25:3389-3402.</BlastOutput_reference>
  <BlastOutput_db>swissprot</BlastOutput_db>
  <BlastOutput_query-ID>Query_1</BlastOutput_query-ID>
  <BlastOutput_query-def>Hemoglobin subunit beta (HBB) [Homo sapiens]</BlastOutput_query-def>
  <BlastOutput_query-len>147</BlastOutput_query-len>
  <BlastOutput_param>
    <Parameters>
      <Parameters_matrix>BLOSUM62</Parameters_matrix>
      <Parameters_expect>10</Parameters_expect>
      <Parameters_gap-open>11</Parameters_gap-open>
      <Parameters_gap-extend>1</Parameters_gap-extend>
    </Parameters>
  </BlastOutput_param>
  <BlastOutput_iterations>
    <Iteration>
      <Iteration_iter-num>1</Iteration_iter-num>
      <Iteration_query-ID>Query_1</Iteration_query-ID>
      <Iteration_query-def>Hemoglobin subunit beta (HBB) [Homo sapiens]</Iteration_query-def>
      <Iteration_query-len>147</Iteration_query-len>
      <Iteration_hits>
        <Hit>
          <Hit_num>1</Hit_num>
          <Hit_id>sp|P68871|HBB_HUMAN</Hit_id>
          <Hit_def>Hemoglobin subunit beta OS=Homo sapiens OX=9606 GN=HBB PE=1 SV=2 [Homo sapiens]</Hit_def>
          <Hit_accession>P68871</Hit_accession>
          <Hit_len>147</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_num>1</Hsp_num>
              <Hsp_bit-score>302.368</Hsp_bit-score>
              <Hsp_score>773</Hsp_score>
              <Hsp_evalue>3.45e-111</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>147</Hsp_query-to>
              <Hsp_hit-from>1</Hsp_hit-from>
              <Hsp_hit-to>147</Hsp_hit-to>
              <Hsp_identity>147</Hsp_identity>
              <Hsp_positive>147</Hsp_positive>
              <Hsp_gaps>0</Hsp_gaps>
              <Hsp_align-len>147</Hsp_align-len>
              <Hsp_qseq>MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH</Hsp_qseq>
              <Hsp_hseq>MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH</Hsp_hseq>
              <Hsp_midline>MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH</Hsp_midline>
            </Hsp>
          </Hit_hsps>
        </Hit>
        <Hit>
          <Hit_num>2</Hit_num>
          <Hit_id>sp|P02008|HBB_MOUSE</Hit_id>
          <Hit_def>Hemoglobin subunit beta-1 OS=Mus musculus OX=10090 GN=Hbb-b1 PE=1 SV=3 [Mus musculus]</Hit_def>
          <Hit_accession>P02008</Hit_accession>
          <Hit_len>147</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_num>1</Hsp_num>
              <Hsp_bit-score>264.618</Hsp_bit-score>
              <Hsp_score>675</Hsp_score>
              <Hsp_evalue>1.20e-96</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>147</Hsp_query-to>
              <Hsp_hit-from>1</Hsp_hit-from>
              <Hsp_hit-to>147</Hsp_hit-to>
              <Hsp_identity>125</Hsp_identity>
              <Hsp_positive>138</Hsp_positive>
              <Hsp_gaps>0</Hsp_gaps>
              <Hsp_align-len>147</Hsp_align-len>
              <Hsp_qseq>MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH</Hsp_qseq>
              <Hsp_hseq>MVHLTDAEKAAVNGLWGKVNPDDVGGEALGRLLVVYPWTQRYFDSFGDLSSASAIMGNPKVKAHGKKVINAFNDGLKHLDNLKGTFAHLSELHCDKLHVDPENFRLLGNMIVIVLAAHHGKEFTTPVQAAFQKVVAGVASALAHKYH</Hsp_hseq>
              <Hsp_midline>MVHLT  EK+AV  LWGKVN D+VGGEALGRLLVVYPWTQR+F+SFGDLS+  A+MGNPKVKAHGKKV+ AF+DGL DHLNLKGTFA LSELHCDKLHVDPENFRLLGN++V VLA H GKEFT PVQAA+QKVVAGVA ALAHKYH</Hsp_midline>
            </Hsp>
          </Hit_hsps>
        </Hit>
        <Hit>
          <Hit_num>3</Hit_num>
          <Hit_id>sp|P01958|HBA_HORSE</Hit_id>
          <Hit_def>Hemoglobin subunit alpha OS=Equus caballus OX=9796 GN=HBA PE=1 SV=2 [Equus caballus]</Hit_def>
          <Hit_accession>P01958</Hit_accession>
          <Hit_len>142</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_num>1</Hsp_num>
              <Hsp_bit-score>114.39</Hsp_bit-score>
              <Hsp_score>285</Hsp_score>
              <Hsp_evalue>4.50e-37</Hsp_evalue>
              <Hsp_query-from>2</Hsp_query-from>
              <Hsp_query-to>139</Hsp_query-to>
              <Hsp_hit-from>1</Hsp_hit-from>
              <Hsp_hit-to>138</Hsp_hit-to>
              <Hsp_identity>59</Hsp_identity>
              <Hsp_positive>88</Hsp_positive>
              <Hsp_gaps>2</Hsp_gaps>
              <Hsp_align-len>139</Hsp_align-len>
              <Hsp_qseq>VHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVAN</Hsp_qseq>
              <Hsp_hseq>VLSAADKTNVKAAWSKVGGHAGEYGAEALERMFLGFPTTKTYFPHFDLSHGSA--QVKAHGKKVGDALTLAVGHLDDLPGALSNLSDLHAHKLRVDPVNFKLLSHCLLVTLASHHPADFTPAVHASLDKFLASVSTVLT</Hsp_hseq>
              <Hsp_midline>V  + ++ +   A  GKV    VGGEAL R++V YPWT+ +F SFGDLS   A      VKAHGKKV  A++  L  L    G  + LS LH DKL VDP NF+LLG++LV VLA H GKEFTP VQAA +K   GV++</Hsp_midline>
            </Hsp>
          </Hit_hsps>
        </Hit>
        <Hit>
          <Hit_num>4</Hit_num>
          <Hit_id>sp|P64481|MYG_HUMAN</Hit_id>
          <Hit_def>Myoglobin OS=Homo sapiens OX=9606 GN=MB PE=1 SV=2 [Homo sapiens]</Hit_def>
          <Hit_accession>P64481</Hit_accession>
          <Hit_len>154</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_num>1</Hsp_num>
              <Hsp_bit-score>54.299</Hsp_bit-score>
              <Hsp_score>129</Hsp_score>
              <Hsp_evalue>1.20e-11</Hsp_evalue>
              <Hsp_query-from>18</Hsp_query-from>
              <Hsp_query-to>119</Hsp_query-to>
              <Hsp_hit-from>21</Hsp_hit-from>
              <Hsp_hit-to>120</Hsp_hit-to>
              <Hsp_identity>25</Hsp_identity>
              <Hsp_positive>51</Hsp_positive>
              <Hsp_gaps>2</Hsp_gaps>
              <Hsp_align-len>102</Hsp_align-len>
              <Hsp_qseq>VNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFG</Hsp_qseq>
              <Hsp_hseq>LKVEADVAGHGQDILIRLFKSHPETLEKFDRFKHLKSEDEMKASEDLKKHGTVVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQ</Hsp_hseq>
              <Hsp_midline>VNV+EVG + LGR++V  P T+ F +SFGDLS+    M + K KAHGKKV+ AFS+GL  L  LKG FA+LSELHCDK+HV P NF++LG +++ V+AHHFG</Hsp_midline>
            </Hsp>
          </Hit_hsps>
        </Hit>
      </Iteration_hits>
    </Iteration>
  </BlastOutput_iterations>
</BlastOutput>
`
  },
  {
    name: "Blastx - Transcriptome de Vigne (Texte Outfmt 0 classique)",
    type: "Blastx (Nucléotides traduits)",
    description: "Format d'affichage standard de BLAST+, montrant des alignements de séquences de transcriptomique végétale (Vitis vinifera) traduits par paires.",
    format: "text",
    content: `BLASTX 2.12.0+
Query= contig_vitis_1042 Viticulture transcriptome assembly
Length=240

Database: swissprot
           565,120 sequences; 202,312,042 total letters

Sequences producing significant alignments:                          (Bits)  Value
sp|P0C0A5|GST_VITIS Glutathione S-transferase [Vitis vinifera]         185.2    1e-51
sp|Q9S725|GST_ARATH Glutathione S-transferase [Arabidopsis thaliana]   140.1    4e-38
sp|P12345|GST_SOYBN Glutathione S-transferase [Glycine max]            80.5     2e-18

>sp|P0C0A5|GST_VITIS Glutathione S-transferase [Vitis vinifera]
Length=218

 Score = 185.2 bits (469),  Expect = 1e-51
 Identities = 78/80 (97%), Gaps = 0/80 (0%)

Query  1    MVKLYPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPK  60
            MVKLY E+KSAVTALWGKVN+DEVGGEALGRLLVVYPWTQR F+SFGDL+TPDAVMGNPK
Sbjct  1    MVKLYAEDKSAVTALWGKVNIDEVGGEALGRLLVVYPWTQRIFDSFGDLNTPDAVMGNPK  60

Query  61   VKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDK  96
            VKAHGKKVLGAFS+GLAHLD+LKGTFATLSE HCDK
Sbjct  61   VKAHGKKVLGAFSNGLAHLDSLKGTFATLSEYHCDK  96


>sp|Q9S725|GST_ARATH Glutathione S-transferase [Arabidopsis thaliana]
Length=220

 Score = 140.1 bits (352),  Expect = 4e-38
 Identities = 62/80 (77%), Gaps = 1/80 (1%)

Query  1    MVKLYPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPK  60
            MV+LY +  ++VTALW  + +++V G+ALGR L++YP ++  FE FGD ST +++ GNPK
Sbjct  1    MVRLYGDS-NSVTALWSNIPIEQVDGDALGRFLLIYPLSRAIFERFGDHSTSESIKGNPK  59

Query  61   VKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDK  96
            ++A GKKVL A S+G+  +  LKGT+  L ELHC+K
Sbjct  60   IRARGKKVLAAVSEGVVEVGKLKGTYTGLVELHCEK  95


>sp|P12345|GST_SOYBN Glutathione S-transferase [Glycine max]
Length=215

 Score = 80.5 bits (197),  Expect = 2e-18
 Identities = 38/80 (47%), Gaps = 2/80 (2%)

Query  1    MVKLYPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPK  60
            MVK Y   ++A    + K+++  V G+ +GRL V YP  ++ F+SF DL+  D +    K
Sbjct  1    MVKFY--GQAASIDTFAKLDIKLVDGQLIGRLSVGYPIGRKIFKSFVDLNNSDDIPKEKK  58

Query  61   VKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDK  96
            ++   KKV  AF DG+ H++ LKGTF T SE + D+
Sbjct  59   LREVAKKVFEAFVDGMKHIEALKGTFGTASEFYKDE  94
`
  }
];
