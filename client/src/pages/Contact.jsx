import StatChip from '../components/StatChip.jsx';

export default function Contact() {
  return (
    <div className="section-wrap py-16 max-w-3xl">
      <p className="kicker mb-4">Contact Us</p>
      <h1 className="font-heading font-black text-4xl mb-6">Get in touch</h1>
      <div className="card p-8 space-y-4 text-sm">
        <div><b className="text-brand-navy">Phone:</b> +91 8179726723</div>
        <div><b className="text-brand-navy">Email:</b> someshtellakula@gmail.com</div>
        <div><b className="text-brand-navy">Website:</b> www.sstaxmentors.com</div>
      </div>
      <div className="flex flex-wrap gap-3 mt-8">
        <StatChip>Pan-India Service</StatChip>
        <StatChip>Response within 4 hours</StatChip>
        <StatChip>WhatsApp support</StatChip>
      </div>
    </div>
  );
}
