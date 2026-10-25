/**
 * KNOuX SmartOrganizer — Applications section service catalogue.
 *
 * Only presentation metadata lives here. Measured application records come
 * exclusively from the native Applications bridge; the previous fixture
 * inventory and fabricated metrics were removed in Mission 05.
 */

export type DomainServiceKey =
  | 'app-inventory'
  | 'app-identity'
  | 'app-search'
  | 'app-publisher'
  | 'app-recent'
  | 'app-uninstall-queue'
  | 'app-leftovers'
  | 'app-updates'
  | 'app-size'
  | 'app-store-packages'
  | 'app-associations'
  | 'app-startup-impact';

export interface DomainServiceMeta {
  key: DomainServiceKey;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  iconName: string;
  color: string;
}

export const DOMAIN_SERVICES_META: DomainServiceMeta[] = [
  {
    key: 'app-inventory',
    labelEn: 'Installed Applications',
    labelAr: 'التطبيقات المثبتة',
    descEn: 'View and manage all apps',
    descAr: 'عرض وإدارة جميع التطبيقات',
    iconName: 'LayoutGrid',
    color: '#2476ff',
  },
  {
    key: 'app-identity',
    labelEn: 'App Identity',
    labelAr: 'هوية التطبيق',
    descEn: 'Verify signatures & trust',
    descAr: 'التحقق من التواقيع والموثوقية',
    iconName: 'ShieldCheck',
    color: '#06b6d4',
  },
  {
    key: 'app-search',
    labelEn: 'Advanced Search',
    labelAr: 'البحث المتقدم',
    descEn: 'Find apps with filters',
    descAr: 'البحث عن التطبيقات بتصفية متقدمة',
    iconName: 'Search',
    color: '#3b82f6',
  },
  {
    key: 'app-publisher',
    labelEn: 'Publisher Intelligence',
    labelAr: 'استخبارات الناشرين',
    descEn: 'Insights & reputation',
    descAr: 'تقييم سمعة وموثوقية الناشرين',
    iconName: 'Building2',
    color: '#a855f7',
  },
  {
    key: 'app-recent',
    labelEn: 'Recently Changed Apps',
    labelAr: 'التطبيقات الحديثة',
    descEn: 'Track recent installations',
    descAr: 'تتبع التثبيتات والتحديثات الأخيرة',
    iconName: 'Clock',
    color: '#818cf8',
  },
  {
    key: 'app-uninstall-queue',
    labelEn: 'Uninstall Queue',
    labelAr: 'قائمة إلغاء التثبيت',
    descEn: 'Manage bulk uninstalls',
    descAr: 'إدارة عمليات الإزالة المتعددة بأمان',
    iconName: 'Trash2',
    color: '#ef4444',
  },
  {
    key: 'app-leftovers',
    labelEn: 'Leftover Analysis',
    labelAr: 'تحليل البقايا',
    descEn: 'Find residual files',
    descAr: 'اكتشاف بقايا الملفات وسجلات النظام',
    iconName: 'Sparkles',
    color: '#f59e0b',
  },
  {
    key: 'app-updates',
    labelEn: 'Update Center',
    labelAr: 'مركز التحديثات',
    descEn: 'Check & install updates',
    descAr: 'فحص وتثبيت تحديثات البرامج',
    iconName: 'RefreshCw',
    color: '#26c6ff',
  },
  {
    key: 'app-size',
    labelEn: 'Software Size',
    labelAr: 'حجم البرمجيات',
    descEn: 'Analyze storage usage',
    descAr: 'تحليل استهلاك مساحة التخزين',
    iconName: 'Database',
    color: '#10b981',
  },
  {
    key: 'app-store-packages',
    labelEn: 'Package Center',
    labelAr: 'مركز الحزم',
    descEn: 'Discover popular apps',
    descAr: 'استكشاف وتثبيت حزم البرامج الشائعة',
    iconName: 'Package',
    color: '#eab308',
  },
  {
    key: 'app-associations',
    labelEn: 'File Associations',
    labelAr: 'ارتباطات الملفات',
    descEn: 'Manage default apps',
    descAr: 'إدارة التطبيقات الافتراضية والامتدادات',
    iconName: 'Link',
    color: '#6366f1',
  },
  {
    key: 'app-startup-impact',
    labelEn: 'Startup Impact',
    labelAr: 'تأثير بدء التشغيل',
    descEn: 'See startup influence',
    descAr: 'معرفة تأثير البرامج على إقلاع النظام',
    iconName: 'Zap',
    color: '#f97316',
  },
];
