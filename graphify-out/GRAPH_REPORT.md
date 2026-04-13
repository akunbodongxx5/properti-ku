# Graph Report - .  (2026-04-13)

## Corpus Check
- 7 files · ~35,236 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 237 nodes · 723 edges · 20 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `getUnits()` - 45 edges
2. `getTenants()` - 31 edges
3. `refreshCurrentPage()` - 26 edges
4. `getPayments()` - 25 edges
5. `escapeHtml()` - 19 edges
6. `closeModal()` - 18 edges
7. `showToast()` - 17 edges
8. `saveTenant()` - 17 edges
9. `renderDashboard()` - 17 edges
10. `renderReports()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `buildTaxReportPrintHtml()` --calls--> `isProMode()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 13_
- `renderReports()` --calls--> `isSimpleMode()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 4_
- `getDashboardGreetingSublineHtml()` --calls--> `escapeHtml()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 2_
- `saveOwnerProfileFromSettings()` --calls--> `showToast()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 3_
- `formatRp()` --calls--> `numLocaleTag()`  [EXTRACTED]
  app.js → app.js  _Bridges community 13 → community 4_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (40): applyPbbAmountFromProperty(), autoFillFacilities(), autoFillPrice(), buildOverviewExportContext(), deleteProperty(), deleteSubtype(), formatNumDots(), formatRpFull() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (6): getUnitAnnualCost(), getUnitMonthlyCost(), saveSettingsForm(), saveTelegramConfig(), togglePaymentFields(), updatePbbLinkRow()

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (28): addOneDayYmdCompact(), autoReminderCheck(), buildReminderIcsCalendar(), dateLocaleTag(), downloadContract(), downloadReminderCalendarIcs(), escapeHtml(), escapeIcsText() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (27): closeModal(), daysUntil(), deletePayment(), deleteTenant(), deleteUnit(), doArchiveTenant(), filterPayments(), getPayments() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (22): calcKPR(), changeReportPeriod(), formatRp(), getAllUnitsAnnualCost(), getMonthYear(), getPropertyAnnualCost(), getPropertyAnnualCostWithCicilan(), getStressParams() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (20): applyUiMode(), closeFabMenu(), dismissOnboarding(), exportOverviewReport(), exportOverviewReportCsv(), getDashboardGreetingSublineHtml(), getGreeting(), getOwnerDisplayName() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.2
Nodes (14): applyExplanationPref(), effectiveYieldCapPct(), emptyStateHTML(), explanationToggleBtn(), getYieldAppreciationPct(), getYieldCapOverrideMap(), getYieldHorizonYears(), getYieldRentEscalationPct() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (11): addCalendarMonths(), calcDefaultDueDay(), countBillingPeriodsForLease(), countMonthlyLeasePeriods(), countYearlyLeasePeriods(), firstDueDateInLease(), generatePaymentsForTenant(), isActionableDueForDashboard() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (10): addUnitForProperty(), addUnitPhoto(), buildChipsHtml(), buildUnitPhotoSection(), deleteUnitPhoto(), getUnitPhotos(), saveUnitPhotos(), showUnitForm() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (6): applyStaticI18n(), getLocale(), initLocale(), setLocale(), t(), updateLangToggleUI()

### Community 10 - "Community 10"
Cohesion: 0.47
Nodes (6): collectBusinessReminders(), deleteMaintenanceTicket(), getMaintenanceTickets(), renderInvestorInsight(), saveMaintenanceTickets(), toggleMaintenanceStatus()

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (5): filterUnits(), isLeaseEndBeforeToday(), renderUnits(), syncUnitOccupancyFromTenants(), togglePropertyGroup()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (4): buildWhatsAppReminderBody(), getReminderWhatsappPhone(), normalizeWhatsAppDigits(), openWhatsAppReminderPage()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (4): buildTaxReportPrintHtml(), exportOverviewReportPdf(), formatIdrPrint(), numLocaleTag()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): getTheme(), setTheme(), toggleTheme()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 15`** (2 nodes): `gtag()`, `analytics.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `server.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `serve-simple.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `rebuild-graph.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUnits()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `getTenants()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `refreshCurrentPage()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 10`, `Community 11`, `Community 14`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._