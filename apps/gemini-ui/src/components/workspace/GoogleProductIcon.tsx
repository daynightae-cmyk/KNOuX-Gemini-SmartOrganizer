/** Official, locally bundled product artwork; no account or image network call. */
import type { ComponentType } from 'react';
type IconProps = { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' };
const product = (id: string): ComponentType<IconProps> => function ProductIcon({ className, ...props }) {
  return <img src={`./brands/google/${id}.png`} className={className} alt="" draggable={false} {...props} style={{ objectFit: 'contain' }} />;
};
export const GoogleProductIcons = {
  google: product('google'), contacts: product('contacts'), gmail: product('gmail'), sheets: product('sheets'), calendar: product('calendar'), forms: product('forms'),
  slides: product('slides'), tasks: product('tasks'), chat: product('chat'), classroom: product('classroom'), drive: product('drive'),
};
