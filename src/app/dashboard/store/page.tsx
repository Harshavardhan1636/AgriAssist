
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { mockProducts, mockStoreLocations } from '@/lib/mock-data';
import type { StoreProduct } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Leaf, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const StoreMap = dynamic(() => import('./store-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

const ProductCard = ({ product }: { product: StoreProduct }) => {
    const { t } = useI18n();

    const getProductTypeIcon = (type: StoreProduct['type']) => {
        if (type.includes('Organic')) {
            return <Leaf className="h-4 w-4 text-green-600" />;
        }
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                 <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="object-cover w-full h-48 rounded-t-lg"
                    data-ai-hint={product.imageHint}
                />
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col">
                <div className="flex-grow">
                    <CardTitle className="text-lg mb-2">{t(product.name as any)}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                        {getProductTypeIcon(product.type)}
                        <Badge variant="outline">{t(product.type as any)}</Badge>
                        {product.toxicity && <Badge variant="secondary">{t('Toxicity')}: {t(product.toxicity as any)}</Badge>}
                    </div>
                    <CardDescription className="text-sm">{t(product.description as any)}</CardDescription>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-xl font-bold">₹{product.price}</p>
                    <Button>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t('Add to Cart')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


export default function StorePage() {
    const { t } = useI18n();

    // In a real app, these products would be fetched from the `recommendProducts` flow
    // based on the latest analysis.
    const products = mockProducts;

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('Store')}</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Local Retailer Map')}</CardTitle>
                    <CardDescription>{t('Find approved retailers near you.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <StoreMap locations={mockStoreLocations} />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('Recommended Products')}</CardTitle>
                    <CardDescription>{t("Safe and effective products based on your crop's needs.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
