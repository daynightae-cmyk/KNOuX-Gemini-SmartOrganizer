"""One-time bounded source migration; refuses an already wrapped main."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'src'
pages={
 'pages/HomePage.tsx': 'locale={locale} heroTypes={[HomeCommandCenter]} primaryTypes={[HomeDashboardPanels]}',
 'smart-scan/SmartScanPage.tsx': "locale={isArabic ? 'ar' : 'en'} heroTypes={[SmartScanHero]} metricTypes={[ScanMetrics]} toolTypes={[ScanServices]}",
 'pages/ApplicationsPage.tsx': 'locale={locale} heroTypes={[ApplicationsHero]} toolTypes={[ApplicationServices]}',
 'pages/StoragePage.tsx': "locale={isArabic ? 'ar' : 'en'} statusTypes={[StorageBanner]}",
 'pages/CleanupPage.tsx': 'locale={locale} heroTypes={[CleanupHero]} toolTypes={[ServiceRail]}',
 'pages/StartupPage.tsx': 'locale={locale} heroTypes={[StartupHero]} toolTypes={[ServiceRail]}',
 'pages/SystemPage.tsx': 'locale={locale}',
 'pages/RepairPage.tsx': 'locale={locale}',
 'pages/ServicesPage.tsx': 'locale={locale}',
 'pages/AutomationPage.tsx': 'locale={locale}',
}
for name,props in pages.items():
    path=root/name; text=path.read_text(encoding='utf8')
    if '<CommandCanvas ' in text: raise RuntimeError(f'Already wrapped: {name}')
    start=re.search(r'<main\b[^>]*>',text)
    if not start: raise RuntimeError(f'No main: {name}')
    end=text.index('</main>',start.end())
    text=text[:end]+'\n          </CommandCanvas>\n          '+text[end:]
    text=text[:start.end()]+f'\n          <CommandCanvas {props}>'+text[start.end():]
    text="import { CommandCanvas } from '../visual/CommandCanvas';\n"+text
    if name.endswith('StoragePage.tsx'):
        text=text.replace('className="grid grid-cols-2 md:grid-cols-5 gap-3"','className="knx-storage-metrics grid grid-cols-2 md:grid-cols-5 gap-3"',1)
    path.write_text(text,encoding='utf8')
    print(name)
