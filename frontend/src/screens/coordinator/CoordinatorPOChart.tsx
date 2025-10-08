import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts";
 
const PO_DEFS: Array<{ code: string; label: string; desc: string }> = [
  { code: "A", label: "PO1", desc: "Apply knowledge of computing, science, and mathematics in solving computing/IT-related problems." },
  { code: "B", label: "PO2", desc: "Use current best practices and standards in solving complex computing/IT-related problems and requirements." },
  { code: "C", label: "PO3", desc: "Analyze complex computing/IT-related problems; define appropriate computing requirements." },
  { code: "D", label: "PO4", desc: "Identify and analyze user needs and consider them in computer-based systems." },
  { code: "E", label: "PO5", desc: "Design, implement, and evaluate computer-based systems under various constraints." },
  { code: "F", label: "PO6", desc: "Integrate IT-based solutions considering public health/safety, cultural, societal, and environmental concerns." },
  { code: "G", label: "PO7", desc: "Select/adapt/apply appropriate techniques, resources, skills, and modern tools with awareness of limits." },
  { code: "H", label: "PO8", desc: "Work effectively individually and in diverse/multidisciplinary/multicultural teams; lead when needed." },
  { code: "I", label: "PO9", desc: "Assist in the creation of effective IT project plans." },
  { code: "J", label: "PO10", desc: "Communicate effectively in oral and written forms to diverse audiences." },
  { code: "K", label: "PO11", desc: "Assess local/global impact of IT on individuals, organizations, and society." },
  { code: "L", label: "PO12", desc: "Act ethically and responsibly regarding professional, legal, security, and social considerations." },
  { code: "M", label: "PO13", desc: "Pursue independent learning; keep pace with latest IT developments." },
  { code: "N", label: "PO14", desc: "Participate in R&D aligned to local/national goals; contribute to the economy." },
  { code: "O", label: "PO15", desc: "Preserve and promote Filipino historical and cultural heritage." },
];

export function CoordinatorPOChart({ section, studentId, title, selectedWeek }: { section?: string; studentId?: string; title?: string; selectedWeek?: number }) {
  const [scores, setScores] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  // Function to download CSV with PO scores and summary
  const downloadCSV = () => {
    if (!scores || !summary) {
      alert('No data available to download');
      return;
    }

    // Create CSV content
    const csvContent = [
      // Header
      ['Program Outcome', 'Code', 'Score (%)', 'Description'],
      // Data rows
      ...PO_DEFS.map((def, i) => [
        def.label,
        def.code,
        scores[i] || 0,
        def.desc
      ]),
      // Empty row
      [],
      // Summary section
      ['Summary:', summary],
      [],
      // Metadata
      ['Generated on:', new Date().toLocaleString()],
      ['Section:', section || 'All Sections'],
      ...(studentId ? [['Student ID:', `"${studentId}"`]] : []), // Only include Student ID for individual student reports
      ['Report Type:', studentId ? 'Individual Student' : 'Section Summary']
    ];

    // Convert to CSV string
    const csvString = csvContent.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = studentId 
      ? `PO_Summary_Student_${studentId}_${timestamp}.csv`
      : `PO_Summary_Section_${section || 'All'}_${timestamp}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Enhanced keyword map per PO with synonyms, variations, and equivalent phrases
  const PO_KEYWORDS: string[][] = [
    // PO1: Apply knowledge of computing, science, and mathematics
    ["math", "mathematics", "science", "theory", "analyz", "compute", "algorithm", "formula", "equation", "calculation", "statistical", "numerical", "scientific", "theoretical", "computational", "logical", "reasoning", "problem solving", "data analysis", "quantitative"],
    
    // PO2: Use current best practices and standards
    ["best practice", "standards", "guideline", "conform", "policy", "methodology", "procedure", "protocol", "convention", "established", "industry standard", "quality", "compliance", "regulation", "framework", "approach", "technique", "method", "process", "workflow"],
    
    // PO3: Analyze complex computing problems
    ["analyze", "analysis", "problem", "requirements", "root cause", "investigate", "examine", "study", "assess", "evaluate", "diagnose", "troubleshoot", "debug", "complex", "challenging", "difficult", "issue", "challenge", "obstacle", "constraint"],
    
    // PO4: Identify and analyze user needs
    ["user need", "user needs", "feedback", "ux", "requirement", "stakeholder", "client", "customer", "end user", "usability", "user experience", "interface", "interaction", "accessibility", "user friendly", "human centered", "user centered", "needs analysis", "requirements gathering"],
    
    // PO5: Design, implement, and evaluate systems
    ["design", "implement", "build", "develop", "evaluate", "create", "construct", "architect", "engineer", "program", "code", "develop", "construct", "assemble", "integrate", "deploy", "test", "validate", "verify", "system", "coding", "testing", "react", "node", "application"],
    
    // PO6: Integrate solutions considering public health/safety
    ["safety", "health", "environment", "societal", "culture", "public", "community", "social", "environmental", "sustainable", "green", "eco", "safety", "security", "protection", "wellbeing", "welfare", "impact", "responsibility", "ethical consideration"],
    
    // PO7: Select/adapt/apply appropriate techniques and tools
    ["tool", "framework", "library", "modern", "adapt", "select", "technology", "software", "platform", "application", "utility", "resource", "technique", "approach", "method", "solution", "innovation", "cutting edge", "advanced", "contemporary"],
    
    // PO8: Work effectively in teams
    ["team", "teamwork", "collaborat", "leader", "group", "cooperation", "coordination", "partnership", "alliance", "collective", "joint", "shared", "collaborative", "multidisciplinary", "diverse", "leadership", "management", "supervision", "mentoring", "guidance"],
    
    // PO9: Assist in creation of effective project plans
    ["plan", "milestone", "schedule", "project plan", "gantt", "timeline", "roadmap", "strategy", "blueprint", "outline", "agenda", "program", "initiative", "project management", "planning", "organization", "coordination", "execution", "delivery", "completion"],
    
    // PO10: Communicate effectively
    ["communicat", "present", "documentation", "write", "oral", "speak", "explain", "describe", "report", "presentation", "document", "manual", "guide", "instruction", "tutorial", "training", "education", "teaching", "sharing", "convey"],
    
    // PO11: Assess local/global impact
    ["impact", "society", "organization", "global", "local", "worldwide", "international", "national", "regional", "community", "influence", "effect", "consequence", "outcome", "result", "benefit", "advantage", "contribution", "significance", "importance"],
    
    // PO12: Act ethically and responsibly
    ["ethical", "privacy", "security", "legal", "responsib", "moral", "integrity", "honesty", "transparency", "accountability", "compliance", "regulation", "law", "policy", "guideline", "standard", "principle", "value", "trust", "reliability"],
    
    // PO13: Pursue independent learning
    ["learn", "self-study", "latest", "new skill", "independent", "autonomous", "self-directed", "continuous", "lifelong", "ongoing", "development", "improvement", "enhancement", "upgrade", "advancement", "progress", "growth", "evolution", "innovation", "cutting edge", "learned", "learning", "gained", "experience", "skills"],
    
    // PO14: Participate in R&D
    ["research", "r&d", "innovation", "experiment", "paper", "study", "investigation", "exploration", "discovery", "development", "creation", "invention", "breakthrough", "advancement", "progress", "scientific", "academic", "scholarly", "theoretical", "practical"],
    
    // PO15: Preserve Filipino heritage
    ["filipino", "heritage", "culture", "tradition", "history", "philippines", "local", "national", "indigenous", "custom", "practice", "value", "belief", "identity", "patrimony", "legacy", "ancestral", "historical", "cultural", "traditional"]
  ];

  function extractHighlights(text: string): { scores: number[]; sentence: string } {
    const t = text.toLowerCase();
    const foundPerPO: string[][] = PO_KEYWORDS.map(() => []);
    
    // Enhanced matching function that considers synonyms, variations, and equivalent phrases
    function findMatches(text: string, keywords: string[]): { count: number; found: string[] } {
      let count = 0;
      const found: string[] = [];
      
      for (const keyword of keywords) {
        // Exact match
        if (text.includes(keyword)) {
          count++;
          found.push(keyword);
          continue;
        }
        
        // Partial match for compound words (e.g., "user experience" matches "ux")
        const words = keyword.split(' ');
        if (words.length > 1) {
          const partialMatch = words.some(word => text.includes(word));
          if (partialMatch) {
            count++;
            found.push(keyword);
            continue;
          }
        }
        
        // Stemming and variations (basic implementation)
        const stem = keyword.replace(/ing$|ed$|s$|er$|est$/, '');
        if (stem.length > 3 && text.includes(stem)) {
          count++;
          found.push(keyword);
          continue;
        }
        
        // Check for variations with common prefixes/suffixes
        const variations = [
          keyword + 's', keyword + 'ing', keyword + 'ed', keyword + 'er',
          keyword.replace(/s$/, ''), keyword.replace(/ing$/, ''), keyword.replace(/ed$/, '')
        ];
        
        for (const variation of variations) {
          if (text.includes(variation)) {
            count++;
            found.push(keyword);
            break;
          }
        }
      }
      
      return { count, found };
    }
    
    // Step 3: Count keyword matches for each PO with enhanced matching
    const rawCounts = PO_KEYWORDS.map((set, i) => {
      const result = findMatches(t, set);
      foundPerPO[i] = result.found;
      return result.count;
    });
    
    // Step 4: Get total matches across all POs
    const totalMatchesAcrossAllPOs = rawCounts.reduce((sum, count) => sum + count, 0);
    
    // Step 5: Calculate percentage per PO using exact formula: PO% = (Matches for PO / Total Matches Across All POs) × 100
    // If no matches found, give equal distribution to avoid all zeros
    const scores = rawCounts.map((matchesForPO) => {
      if (totalMatchesAcrossAllPOs > 0) {
        return Math.round((matchesForPO / totalMatchesAcrossAllPOs) * 100)
      } else {
        // If no matches, distribute equally among all POs (6.67% each for 15 POs)
        return Math.round(100 / 15)
      }
    });

    // Debug logging to verify calculation
    console.log('Match counts:', rawCounts);
    console.log('Total matches:', totalMatchesAcrossAllPOs);
    console.log('Calculated percentages:', scores);

    // Create a proper sentence showing all found words without match counts
    const foundPOs: string[] = [];
    rawCounts.forEach((c, i) => {
      if (c > 0) {
        const allWords = Array.from(new Set(foundPerPO[i])).join(', ');
        foundPOs.push(`${PO_DEFS[i].label} (${PO_DEFS[i].code}): ${allWords}`);
      }
    });
    
    let sentence = '';
    if (foundPOs.length === 0) {
      sentence = 'No specific program outcomes identified in the summary.';
    } else if (foundPOs.length === 1) {
      sentence = `The student's learnings demonstrate ${foundPOs[0]}.`;
    } else if (foundPOs.length === 2) {
      sentence = `The student's learnings demonstrate ${foundPOs[0]} and ${foundPOs[1]}.`;
    } else {
      const head = foundPOs.slice(0, -1).join(', ');
      const last = foundPOs[foundPOs.length - 1];
      sentence = `The student's learnings demonstrate ${head}, and ${last}.`;
    }
    
    return { scores, sentence };
  }

  // Enhanced week-by-week analysis function
  async function calculateWeekByWeekScores(): Promise<{ scores: number[]; sentence: string }> {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      console.log('Fetching reports for section:', section, 'studentId:', studentId)
      const response = await fetch(`${base}/api/reports?section=${encodeURIComponent(section || '')}${studentId ? `&studentId=${encodeURIComponent(studentId)}` : ''}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`)
      }
      
      const reports = await response.json()
      console.log('Fetched reports:', reports)
      
      if (!Array.isArray(reports) || reports.length === 0) {
        return { scores: Array.from({ length: 15 }, () => 0), sentence: 'No reports found for analysis.' }
      }

      // Filter reports by selected week if specified
      let filteredReports = reports
      if (selectedWeek && selectedWeek > 0) {
        filteredReports = reports.filter((report: any) => (report.weekNumber || 1) === selectedWeek)
        console.log(`Filtered reports for week ${selectedWeek}:`, filteredReports)
        
        if (filteredReports.length === 0) {
          return { scores: Array.from({ length: 15 }, () => 0), sentence: `No reports found for Week ${selectedWeek}.` }
        }
      }

      // Group reports by week
      const reportsByWeek = new Map<number, any[]>()
      filteredReports.forEach((report: any) => {
        const week = report.weekNumber || 1
        if (!reportsByWeek.has(week)) {
          reportsByWeek.set(week, [])
        }
        reportsByWeek.get(week)!.push(report)
      })

      console.log('Reports by week:', Array.from(reportsByWeek.entries()))

      // Step 1: Analyze each week individually
      const weeklyScores: number[][] = []
      const weeklySentences: string[] = []

      for (const [weekNumber, weekReports] of reportsByWeek) {
        // Combine all reports for this week into a single text
        const weekText = weekReports.map((r: any) => 
          `Week ${weekNumber}: ${r.activities || ''} ${r.learnings || ''}`.trim()
        ).join(' ')

        console.log(`Week ${weekNumber} text:`, weekText)

        if (weekText.trim()) {
          // Calculate PO scores for this week
          const weekAnalysis = extractHighlights(weekText)
          weeklyScores.push(weekAnalysis.scores)
          weeklySentences.push(`Week ${weekNumber}: ${weekAnalysis.sentence}`)
          
          console.log(`Week ${weekNumber} scores:`, weekAnalysis.scores)
          console.log(`Week ${weekNumber} sentence:`, weekAnalysis.sentence)
        } else {
          console.log(`Week ${weekNumber} has no text content`)
        }
      }

      if (weeklyScores.length === 0) {
        return { scores: Array.from({ length: 15 }, () => 0), sentence: `No valid reports found for ${selectedWeek ? `Week ${selectedWeek}` : 'analysis'}.` }
      }

      // Step 2: Add all weeks together (total hits/percentages)
      const totalScores = Array.from({ length: 15 }, () => 0)
      weeklyScores.forEach(weekScores => {
        weekScores.forEach((score, poIndex) => {
          totalScores[poIndex] += score
        })
      })

      console.log('Total scores across all weeks:', totalScores)

      // Step 3: Normalize to 100%
      const overallTotal = totalScores.reduce((sum, score) => sum + score, 0)
      const normalizedScores = overallTotal > 0 
        ? totalScores.map(score => Math.round((score / overallTotal) * 100))
        : Array.from({ length: 15 }, () => 0)

      console.log('Overall total:', overallTotal)
      console.log('Normalized scores:', normalizedScores)

      // Create comprehensive sentence
      const sentence = weeklySentences.length > 0 
        ? weeklySentences.join(' ')
        : selectedWeek 
          ? `No specific program outcomes identified for Week ${selectedWeek}.`
          : 'No specific program outcomes identified across all weeks.'

      return { scores: normalizedScores, sentence }
    } catch (error) {
      console.error('Error in week-by-week analysis:', error)
      return { scores: Array.from({ length: 15 }, () => 0), sentence: 'Error analyzing reports.' }
    }
  }

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        console.log('Starting analysis for section:', section, 'week:', selectedWeek)
        
        // Use the new week-by-week analysis function
        const analysis = await calculateWeekByWeekScores()
        setScores(analysis.scores)
        setSummary(analysis.sentence)
        
        console.log('Week-by-week analysis result:', analysis)
      } catch (e: any) {
        console.error('Error in week-by-week analysis:', e)
        setScores(Array.from({ length: 15 }, () => 0))
        setSummary(`Error analyzing reports: ${e.message || "Unknown error"}`)
        setError(e.message || "Unknown error")
      }
    }

    run()
  }, [section, studentId, selectedWeek])

  const data = useMemo(() => {
    const values = scores ?? Array.from({ length: 15 }, () => 0);
    return PO_DEFS.map((def, i) => ({
      po: `${def.label} (${def.code})`,
      code: def.code,
      label: def.label,
      desc: def.desc,
      value: values[i] ?? 0,
      index: i,
    }));
  }, [scores]);

  // extractHighlights provides both scores and keyword-based sentence

  function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
      const p = payload[0];
      const idx = payload[0]?.payload?.index ?? 0;
      const def = PO_DEFS[idx];
      return (
        <div style={{ background: '#ffffff', color: '#000000', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', maxWidth: 320, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#000000' }}>{label}</div>
          <div style={{ marginBottom: 4, color: '#000000' }}>Score: {p.value}%</div>
          <div style={{ fontSize: 12, color: '#000000' }}>{def?.desc}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center'
    }}>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 600, fontSize: '18px', color: '#000000' }}>{title}</div>
      )}
      {error && (
        <div style={{ color: "#000000", marginBottom: 12, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 4 }}>
          AI scoring error: {error}
        </div>
      )}
      {summary && (
        <div style={{ color: "#000000", marginBottom: 12, fontStyle: 'italic', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 4 }}>
          {summary}
        </div>
      )}
      {/* Download Button */}
      {scores && summary && (
        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <button
            onClick={downloadCSV}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📊 Download CSV Report
          </button>
        </div>
      )}
      {/* Chart Container - Scrollable wrapper for the chart */}
      <div style={{ 
        width: '100%', 
        height: '700px',
        overflowX: 'auto',
        overflowY: 'hidden',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        <div style={{ 
          minWidth: '1200px', // Ensure minimum width for all bars to be visible
          height: '100%'
        }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            // Chart margins - provides space for labels and axes
            margin={{ 
              bottom: 180,  // Space for vertical X-axis labels
              left: 40,     // Space for Y-axis labels
              right: 40,    // Right padding
              top: 90       // Top padding for title
            }}
            barCategoryGap="5%"  // Gap between bar categories
          >
            {/* X-Axis Configuration - Program Outcomes labels */}
            <XAxis 
              dataKey="po" 
              interval={0}                    // Show all labels
              tick={{ fontSize: 9, fill: '#000000' }}  // Label font styling
              tickMargin={15}                 // Margin between labels and axis
              angle={-90}                     // Vertical label orientation
              textAnchor="end"                // Text alignment
              height={120}                    // Height allocated for X-axis
            />
            {/* Y-Axis Configuration - Score percentage */}
            <YAxis 
              domain={[0, 100]}               // Score range 0-100%
              tick={{ fontSize: 14, fill: '#000000' }}  // Tick font styling
              width={60}                     // Width allocated for Y-axis
              label={{ 
                value: 'Score (%)', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle', fill: '#000000' } 
              }}
            />
            {/* No Tooltip; show values inside bars */}
            <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={50}>
              <LabelList dataKey="value" position="insideTop" formatter={(v: any) => `${v}%`} fill="#ffffff" style={{ fontSize: 12 }} />
            </Bar>
        </BarChart>
      </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
