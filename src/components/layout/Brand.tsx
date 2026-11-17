import Icon from '../ui/Icon';

export default function Brand({ subtitle = 'Một chút cà phê, một chút thư thả.' }: { subtitle?: string }) {
  return <span className="app-brand" translate="no">
    <span className="app-brand__symbol"><Icon name="coffee" /></span>
    <span className="app-brand__text"><strong>L’Atelier Café</strong><span>{subtitle}</span></span>
  </span>;
}
