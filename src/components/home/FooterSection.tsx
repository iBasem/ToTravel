import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

export function FooterSection() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="bg-foreground text-background py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">travelle</span>
            </div>
            <p className="text-muted">{t('footer.tagline')}</p>
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-muted">
              <li><Link to="#about" className="hover:text-background transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link to="#careers" className="hover:text-background transition-colors">{t('footer.careers')}</Link></li>
              <li><Link to="#press" className="hover:text-background transition-colors">{t('footer.press')}</Link></li>
            </ul>
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-muted">
              <li><Link to="#help" className="hover:text-background transition-colors">{t('footer.helpCenter')}</Link></li>
              <li><Link to="#contact" className="hover:text-background transition-colors">{t('footer.contactUs')}</Link></li>
              <li><Link to="#safety" className="hover:text-background transition-colors">{t('footer.safety')}</Link></li>
            </ul>
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-muted">
              <li><Link to="#terms" className="hover:text-background transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link to="#privacy" className="hover:text-background transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="#cookies" className="hover:text-background transition-colors">{t('footer.cookiePolicy')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-muted/20 mt-8 pt-8 text-center text-muted">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
