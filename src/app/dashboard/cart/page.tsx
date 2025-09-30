'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/context/i18n-context';
import { useCart } from '@/context/cart-context';
import { Minus, Plus, ShoppingCart, Trash2, IndianRupee } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function CartPage() {
    const { t } = useI18n();
    const { cart, removeFromCart, updateQuantity, getCartTotal, simulatePurchase, isPurchasing } = useCart();
    const { toast } = useToast();
    const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const handlePurchase = async () => {
        if (cart.length === 0) {
            toast({
                title: t('Empty Cart'),
                description: t('Your cart is empty. Add some products before checking out.'),
                variant: 'destructive',
            });
            return;
        }

        const result = await simulatePurchase();
        setPurchaseResult(result);
        
        if (result.success) {
            toast({
                title: t('Order Placed'),
                description: result.message,
            });
        } else {
            toast({
                title: t('Order Failed'),
                description: result.message,
                variant: 'destructive',
            });
        }
    };

    if (purchaseResult?.success) {
        return (
            <div className="grid gap-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-semibold">{t('Order Confirmation')}</h1>
                </div>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('Order Successful!')}</h2>
                        <p className="text-center text-muted-foreground mb-6">
                            {purchaseResult.message}
                        </p>
                        <Button onClick={() => setPurchaseResult(null)}>
                            {t('Continue Shopping')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-8">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-semibold">{t('Shopping Cart')}</h1>
            </div>
            
            {purchaseResult && !purchaseResult.success && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('Order Failed')}</AlertTitle>
                    <AlertDescription>{purchaseResult.message}</AlertDescription>
                </Alert>
            )}

            {cart.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('Your cart is empty')}</h2>
                        <p className="text-center text-muted-foreground mb-6">
                            {t('Add some products to your cart to get started.')}
                        </p>
                        <Button onClick={() => window.location.href = '/dashboard/store'}>
                            {t('Browse Products')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Cart Items')}</CardTitle>
                                <CardDescription>{t('Review and manage the items in your cart.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="relative h-16 w-16">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover rounded-md"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-medium">{t(item.name as any)}</h3>
                                                <p className="text-sm text-muted-foreground">{t(item.type as any)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="font-medium">
                                                ₹{item.price * item.quantity}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Order Summary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>{t('Subtotal')}</span>
                                        <span>₹{getCartTotal()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('Shipping')}</span>
                                        <span>{getCartTotal() > 0 ? '₹50' : '₹0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('Tax')}</span>
                                        <span>₹{Math.round(getCartTotal() * 0.18)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                        <span>{t('Total')}</span>
                                        <span>₹{getCartTotal() > 0 ? getCartTotal() + 50 + Math.round(getCartTotal() * 0.18) : 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={handlePurchase}
                                    disabled={isPurchasing || cart.length === 0}
                                >
                                    {isPurchasing ? t('Processing...') : t('Checkout')}
                                </Button>
                            </CardFooter>
                        </Card>
                        
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5" />
                                    {t('Secure Payment')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {t('Your payment information is securely processed. All transactions are encrypted and protected.')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}