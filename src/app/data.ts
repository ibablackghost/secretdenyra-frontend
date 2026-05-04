import imgDigestion from 'figma:asset/de14469ac6d7fbc9bfae344f9b05d2daa55eefdf.png';
import imgDetox from 'figma:asset/3e98b625e2ab73232f407d18000ed6c801a1cb2c.png';
import imgTheNoir from 'figma:asset/4af3d60f9ef750f3824061de6d92bbf9e1e9c6ec.png';
import imgTheBlanc from 'figma:asset/35783a1903ef9b2d352590562e59c39ca57f8fb7.png';
import imgInfusion from 'figma:asset/fda277a5b54ab52183b7f0a4221f95fb4d48bfed.png';
import imgTheVert from 'figma:asset/2dbfcc0ed633c6982ef59109caf2de6926fabc20.png';
import imgBienEtre from 'figma:asset/6a3ac58fc7cd71342364354032a5815209cd40fc.png';

export const products = [
  {
    id: 'digestion',
    name: 'DIGESTION® (TISANE)',
    ingredients: 'Menthe poivrée • Anis • Fenouil • Réglisse',
    price: 24999,
    rating: 4.9,
    reviews: 43,
    image: imgDigestion,
    bgClass: 'bg-[#F2EDF3]',
    category: 'Infusion'
  },
  {
    id: 'detox',
    name: 'DÉTOX® (TISANE)',
    ingredients: 'Citron • Gingembre • Pissenlit',
    price: 22000,
    rating: 4.8,
    reviews: 120,
    image: imgDetox,
    bgClass: 'bg-[#FDFCE0]',
    category: 'Infusion'
  },
  {
    id: 'sommeil',
    name: 'SOMMEIL PROFOND®',
    ingredients: 'Camomille • Valériane • Passiflore',
    price: 26500,
    rating: 5.0,
    reviews: 89,
    image: imgDigestion,
    bgClass: 'bg-[#F8E7E9]',
    category: 'Tisanes'
  },
  {
    id: 'energie',
    name: 'ÉNERGIE MATINALE®',
    ingredients: 'Thé vert • Ginseng • Guarana',
    price: 24999,
    rating: 4.7,
    reviews: 210,
    image: imgDetox,
    bgClass: 'bg-[#EAF3EA]',
    category: 'Thé vert'
  }
];

export const categories = [
  { id: 'the-noir', name: 'Thé noir', image: imgTheNoir },
  { id: 'the-blanc', name: 'Thé blanc', image: imgTheBlanc },
  { id: 'infusion', name: 'Infusion', image: imgInfusion },
  { id: 'the-vert', name: 'Thé vert', image: imgTheVert },
  { id: 'bien-etre', name: 'Bien-être', image: imgBienEtre }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(price).replace('XOF', ' XOF');
};