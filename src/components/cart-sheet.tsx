
'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { useCart } from '@/context/cart-context';
import { useI18n } from '@/context/i18n-context';
import Image from 'next/image';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface CartSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function CartSheet({ isOpen, onOpenChange }: CartSheetProps) {
    const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
    const { t } = useI18n();
    const { toast } = useToast();

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
        onOpenChange(false); // Close the sheet
        
        toast({
            title: t('Order Placed!'),
            description: t('Thank you for your purchase. Your items are on their way.'),
            variant: 'default',
        });
        
        // In a real app, this would redirect to a payment gateway
        // or an order confirmation page. Here, we just clear the cart.
        clearCart();
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>{t('Your Cart')}</SheetTitle>
                </SheetHeader>
                <Separator />

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-grow text-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">{t('Your cart is empty')}</h3>
                        <p className="text-sm text-muted-foreground">{t('Add items from the store to get started.')}</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-grow my-4">
                            <div className="space-y-4 pr-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <Image
                                            src={item.image}
                                            alt={t(item.name as any)}
                                            width={64}
                                            height={64}
                                            className="rounded-md border object-cover"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{t(item.name as any)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity} x ₹{item.price}
                                            </p>
                                        </div>
                                        <p className="font-semibold">₹{item.price * (item.quantity ?? 1)}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Separator />
                        <SheetFooter className="mt-4 space-y-4">
                             <div className="flex justify-between font-bold text-lg">
                                <p>{t('Total')}</p>
                                <p>₹{getCartTotal()}</p>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleCheckout}>
                                {t('Proceed to Checkout')}
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
