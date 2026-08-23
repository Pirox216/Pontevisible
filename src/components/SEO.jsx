import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, canonical }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}