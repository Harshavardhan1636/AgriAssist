'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import type { StoreProduct, StoreLocation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Leaf, AlertTriangle, TrendingUp, Droplets, Award } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { mockStoreLocations } from '@/lib/mock-data';

const StoreMap = dynamic(() => import('./store-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});

// Product card component
const ProductCard = ({ product }: { product: StoreProduct }) => {
    const { t } = useI18n();
    const { addToCart } = useCart();
    const { toast } = useToast();

    const handleAddToCart = () => {
        addToCart(product);
        toast({
            title: t('Product Added'),
            description: `${t(product.name as any)} ${t('has been added to your cart.')}`,
        });
    }

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
                        {product.isOrganic && (
                            <Badge variant="default" className="bg-green-500">
                                <Leaf className="h-3 w-3 mr-1" />
                                {t('Organic')}
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="text-sm">{t(product.description as any)}</CardDescription>
                    
                    {/* Environmental Metrics */}
                    {product.environmentalImpact && (
                        <div className="mt-3 pt-3 border-t border-muted">
                            <p className="text-sm font-medium mb-2">{t('Environmental Impact')}:</p>
                            <div className="flex flex-wrap gap-2">
                                {product.environmentalImpact.carbonFootprint !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {product.environmentalImpact.carbonFootprint} kg CO₂
                                    </Badge>
                                )}
                                {product.environmentalImpact.waterUsage !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Droplets className="h-3 w-3 mr-1" />
                                        {product.environmentalImpact.waterUsage} L/ha
                                    </Badge>
                                )}
                                {product.environmentalImpact.biodiversityImpact && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Award className="h-3 w-3 mr-1" />
                                        {t(product.environmentalImpact.biodiversityImpact)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {product.organicCertification && (
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                                {t('Organic Certification')}: {product.organicCertification}
                            </p>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-xl font-bold">₹{product.price}</p>
                    <Button onClick={handleAddToCart}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t('Add to Cart')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Function to get recommended products from analysis history
const getRecommendedProducts = (): StoreProduct[] => {
  try {
    // Try to get products specifically stored for the store
    const storeProductsKey = 'agriassist_store_products';
    const storedProducts = localStorage.getItem(storeProductsKey);
    
    if (storedProducts) {
      const products = JSON.parse(storedProducts);
      // Ensure we return an array
      return Array.isArray(products) ? products : [];
    }
    
    // Fallback to getting products from the latest analysis
    const historyKey = 'agriassist_analysis_history';
    const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Get the latest analysis
    if (storedHistory.length > 0) {
      const latestAnalysis = storedHistory[0];
      if (latestAnalysis.recommendedProducts && Array.isArray(latestAnalysis.recommendedProducts) && latestAnalysis.recommendedProducts.length > 0) {
        return latestAnalysis.recommendedProducts;
      }
    }
    
    // Fallback to mock products if no real products found
    return [];
  } catch (error) {
    console.error("Error getting recommended products:", error);
    // Return empty array if there's an error
    return [];
  }
};

// Function to get real store locations (in a real app, this would come from an API)
const getRealStoreLocations = async (): Promise<StoreLocation[]> => {
  // In a real implementation, we would fetch from an API:
  // const response = await fetch('/api/stores');
  // const data = await response.json();
  // return data;
  
  // For now, we'll use the mock data from mock-data.ts
  return mockStoreLocations;
};

export default function StorePage() {
    const { t } = useI18n();
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [locations, setLocations] = useState<StoreLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const { cart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get recommended products based on analysis history
                const recommendedProducts = getRecommendedProducts();
                setProducts(recommendedProducts.length > 0 ? recommendedProducts : []);
                
                // Get real store locations
                const realLocations = await getRealStoreLocations();
                setLocations(realLocations);
            } catch (error) {
                console.error("Error fetching store data:", error);
                // For locations, we'll keep the mock data as fallback
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('Store')}</h1>
                {cart.length > 0 && (
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/cart">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {t('View Cart')} ({cart.length})
                        </Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Local Retailer Map')}</CardTitle>
                    <CardDescription>{t('Find approved retailers near you.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[400px] w-full rounded-lg" />
                    ) : (
                        <StoreMap locations={locations} />
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('Recommended Products')}</CardTitle>
                    <CardDescription>{t("Safe and effective products based on your crop's needs.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <Card key={i} className="flex flex-col">
                                    <Skeleton className="h-48 w-full rounded-t-lg" />
                                    <CardContent className="p-4 flex-grow flex flex-col">
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2 mb-2" />
                                        <Skeleton className="h-16 w-full mb-4" />
                                        <div className="mt-4 flex justify-between items-center">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-10 w-32" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>{t('No recommended products found. Complete a crop analysis to see personalized recommendations.')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}