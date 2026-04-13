# Graph Report - d:\patrick\Claude app\properti-ku  (2026-04-13)

## Corpus Check
- 6 files · ~33,035 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 225 nodes · 685 edges · 18 communities detected
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

## God Nodes (most connected - your core abstractions)
1. `getUnits()` - 45 edges
2. `getTenants()` - 27 edges
3. `refreshCurrentPage()` - 26 edges
4. `getPayments()` - 24 edges
5. `escapeHtml()` - 18 edges
6. `closeModal()` - 18 edges
7. `saveTenant()` - 17 edges
8. `renderDashboard()` - 17 edges
9. `showToast()` - 14 edges
10. `renderReports()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `isProMode()` --calls--> `getUiMode()`  [EXTRACTED]
  d:\patrick\Claude app\properti-ku\app.js → d:\patrick\Claude app\properti-ku\app.js  _Bridges community 5 → community 10_
- `renderReports()` --calls--> `isSimpleMode()`  [EXTRACTED]
  d:\patrick\Claude app\properti-ku\app.js → d:\patrick\Claude app\properti-ku\app.js  _Bridges community 5 → community 6_
- `getDashboardGreetingSublineHtml()` --calls--> `escapeHtml()`  [EXTRACTED]
  d:\patrick\Claude app\properti-ku\app.js → d:\patrick\Claude app\properti-ku\app.js  _Bridges community 5 → community 2_
- `saveOwnerProfileFromSettings()` --calls--> `showToast()`  [EXTRACTED]
  d:\patrick\Claude app\properti-ku\app.js → d:\patrick\Claude app\properti-ku\app.js  _Bridges community 5 → community 0_
- `formatIdrPrint()` --calls--> `numLocaleTag()`  [EXTRACTED]
  d:\patrick\Claude app\properti-ku\app.js → d:\patrick\Claude app\properti-ku\app.js  _Bridges community 2 → community 10_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.2
Nodes (34): closeModal(), deletePayment(), deleteProperty(), deleteSubtype(), deleteTenant(), deleteUnit(), doArchiveTenant(), getPayments() (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (8): getRpVal(), getUnitAnnualCost(), getUnitMonthlyCost(), saveSettingsForm(), saveTelegramConfig(), saveTenantHistory(), togglePaymentFields(), updatePbbLinkRow()

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (29): applyPbbAmountFromProperty(), calcKPR(), daysUntil(), escapeHtml(), fetchTelegramChatId(), formatDate(), formatNumDots(), formatRp() (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (26): autoReminderCheck(), collectBusinessReminders(), dateLocaleTag(), deleteMaintenanceTicket(), downloadContract(), formatDateShort(), generateContract(), getMaintenanceTickets() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (20): applyExplanationPref(), effectiveYieldCapPct(), emptyStateHTML(), explanationToggleBtn(), filterPayments(), filterUnits(), getYieldAppreciationPct(), getYieldCapOverrideMap() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (18): applyUiMode(), closeFabMenu(), dismissOnboarding(), getDashboardGreetingSublineHtml(), getGreeting(), getOwnerDisplayName(), getStorageUsage(), getUiMode() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (15): buildOverviewExportContext(), changeReportPeriod(), getMonthYear(), getOrCreateProperty(), getProperties(), getStressParams(), getYear(), paymentMatchesCalendarMonth() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.23
Nodes (12): addCalendarMonths(), calcDefaultDueDay(), countBillingPeriodsForLease(), countMonthlyLeasePeriods(), countYearlyLeasePeriods(), firstDueDateInLease(), generatePaymentsForTenant(), isLeaseEndBeforeToday() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (10): addUnitForProperty(), addUnitPhoto(), buildChipsHtml(), buildUnitPhotoSection(), deleteUnitPhoto(), getUnitPhotos(), saveUnitPhotos(), showUnitForm() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (6): applyStaticI18n(), getLocale(), initLocale(), setLocale(), t(), updateLangToggleUI()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): buildTaxReportPrintHtml(), exportOverviewReport(), exportOverviewReportCsv(), exportOverviewReportPdf(), formatIdrPrint(), isProMode()

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (6): autoFillFacilities(), autoFillPrice(), onPropertySelect(), onSubtypeSelect(), refreshChipsUI(), updateSubtypeOptions()

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (3): getTheme(), setTheme(), toggleTheme()

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (2): isActionableDueForDashboard(), shouldIncludePaymentInReminders()

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 13`** (2 nodes): `isActionableDueForDashboard()`, `shouldIncludePaymentInReminders()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `gtag()`, `analytics.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `server.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `sw.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `serve-simple.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUnits()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 11`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `getTenants()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `refreshCurrentPage()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 12`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._