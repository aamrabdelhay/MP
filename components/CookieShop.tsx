"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowUpLeft, CheckCircle2, ChefHat, Clock3, Cookie, Heart,
  Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Sparkles, Star,
  Trash2, Truck, X,
} from "lucide-react";
import styles from "./CookieShop.module.css";

const PRODUCTS = [
  { id: "classic", name: "كوكيز كلاسيك", subtitle: "طري من الداخل ومحمّر من الأطراف", price: 45, tag: "اختيارنا الكلاسيكي" },
  { id: "chocolate", name: "كوكيز بالشوكولاتة", subtitle: "قطع شوكولاتة غنية في كل قضمة", price: 55, tag: "الأكثر طلبًا" },
  { id: "pink", name: "كوكيز بينك", subtitle: "نكهة لطيفة ولمسة وردية مميزة", price: 55, tag: "لمسة مختلفة" },
  { id: "cream", name: "كوكيز بالكريمة", subtitle: "قلب كريمي ناعم مع عجينة طازجة", price: 60, tag: "قلب كريمي" },
  { id: "molten", name: "مولتن كيك", subtitle: "كيك شوكولاتة دافئ بقلب سايح", price: 75, tag: "لعشاق الشوكولاتة" },
] as const;

type ProductId = (typeof PRODUCTS)[number]["id"];
type Cart = Partial<Record<ProductId, number>>;
type Product = (typeof PRODUCTS)[number];

const CART_KEY = "cookie-club-cart-v1";
const SHOP_WHATSAPP = (process.env.NEXT_PUBLIC_SHOP_WHATSAPP ?? "").replace(/\D/g, "");
const formatPrice = (amount: number) => amount.toLocaleString("ar-EG") + " ج.م";

const artClasses: Record<ProductId, string> = {
  classic: styles.artClassic,
  chocolate: styles.artChocolate,
  pink: styles.artPink,
  cream: styles.artCream,
  molten: styles.artMolten,
};

function CookieArtwork({ product }: { product: Product }) {
  return (
    <div className={styles.artStage + " " + artClasses[product.id]} aria-hidden="true">
      <div className={styles.artGlow} />
      <div className={styles.cookieArt}>
        {Array.from({ length: product.id === "molten" ? 3 : 7 }).map((_, index) => <i className={styles.chip} key={index} />)}
        {product.id === "cream" && <span className={styles.creamCenter} />}
        {product.id === "molten" && <span className={styles.moltenCenter} />}
      </div>
      <span className={styles.artStamp}>{product.id === "molten" ? "WARM & GOOEY" : "FRESH BAKED"}</span>
    </div>
  );
}

export function CookieShop() {
  const [cart, setCart] = useState<Cart>({});
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderText, setOrderText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const valid: Cart = {};
          for (const product of PRODUCTS) {
            const value = (parsed as Record<string, unknown>)[product.id];
            if (typeof value === "number" && Number.isInteger(value) && value > 0 && value < 100) valid[product.id] = value;
          }
          setCart(valid);
        }
      }
    } catch {
      // A broken or unavailable local cart should never block shopping.
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Cart still works for the current session when storage is unavailable.
    }
  }, [cart, cartReady]);

  const cartItems = useMemo(() => PRODUCTS.filter((product) => (cart[product.id] ?? 0) > 0), [cart]);
  const itemCount = useMemo(() => Object.values(cart).reduce((sum, quantity) => sum + (quantity ?? 0), 0), [cart]);
  const subtotal = useMemo(
    () => cartItems.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0),
    [cart, cartItems],
  );

  function addToCart(id: ProductId) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setOrderComplete(false);
    setCartOpen(true);
    setCheckoutOpen(false);
  }

  function changeQuantity(id: ProductId, amount: number) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + amount;
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  function openCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
    setOrderComplete(false);
    setCopied(false);
  }

  function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cartItems.length === 0) return;
    const data = new FormData(event.currentTarget);
    const customerName = String(data.get("customerName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const lines = [
      "طلب جديد من COOKIE CLUB",
      "",
      ...cartItems.map((product) => "• " + product.name + " × " + cart[product.id] + " = " + formatPrice(product.price * (cart[product.id] ?? 0))),
      "",
      "الإجمالي قبل التوصيل: " + formatPrice(subtotal),
      "التوصيل: يتم تأكيده حسب المنطقة",
      "",
      "الاسم: " + customerName,
      "رقم الهاتف: " + phone,
      "العنوان: " + address,
      notes ? "ملاحظات: " + notes : "",
      "طريقة الدفع: عند الاستلام",
    ].filter(Boolean);
    const message = lines.join("\n");
    setOrderText(message);
    setOrderComplete(true);

    if (SHOP_WHATSAPP) {
      window.open("https://wa.me/" + SHOP_WHATSAPP + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
      setCart({});
    }
  }

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className={styles.shop} dir="rtl" lang="ar">
      <div className={styles.topNote}><Sparkles size={14} /><span>دفعات طازة يوميًا — حلاوتك علينا</span><Sparkles size={14} /></div>
      <div className={styles.container}>
        <header className={styles.header}>
          <a className={styles.brand} href="#home" aria-label="Cookie Club - الصفحة الرئيسية">
            <span className={styles.brandMark}><Cookie size={25} strokeWidth={1.8} /></span>
            <span className={styles.brandWords}><strong>COOKIE CLUB</strong><small>كوكيز على مزاجك</small></span>
          </a>
          <nav className={styles.nav} aria-label="التنقل الرئيسي">
            <a href="#products">المنيو</a><a href="#about">حكايتنا</a><a href="#footer">تواصل معنا</a>
          </nav>
          <button className={styles.cartButton} onClick={() => { setCartOpen(true); setCheckoutOpen(false); }} type="button">
            <ShoppingBag size={18} /><span>السلة</span><b>{itemCount}</b>
          </button>
        </header>

        <section className={styles.hero} id="home">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span /> BAKED FRESH, MADE WITH LOVE</span>
            <h1>يومك محتاج<br /><em>حاجة حلوة.</em></h1>
            <p>كوكيز طري، شوكولاتة غنية، وقلب كريمي يخلي كل قضمة حكاية. اختار مزاجك وسيب الباقي علينا.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#products">اكتشف المنيو <ArrowLeft size={17} /></a>
              <a className={styles.secondaryButton} href="#about">اعرف حكايتنا</a>
            </div>
            <div className={styles.heroFacts}>
              <span><Clock3 size={16} /> مخبوز طازة</span><span><Heart size={16} /> معمول بحب</span><span><PackageCheck size={16} /> متغلف بعناية</span>
            </div>
          </div>
          <div className={styles.heroVisual} aria-label="تشكيلة كوكيز طازجة">
            <div className={styles.heroOrbit} />
            <div className={styles.heroCookie}>
              <div className={styles.heroCookieChips}><i /><i /><i /><i /><i /><i /><i /></div>
              <span className={styles.heroCookieBite} />
            </div>
            <div className={styles.floatCard}>
              <span className={styles.floatStars}><Star /><Star /><Star /><Star /><Star /></span>
              <strong>لقمة تظبط يومك</strong><small>Freshly baked for you</small>
            </div>
            <div className={styles.floatTag}><ChefHat size={17} /> طازة كل يوم</div>
            <span className={styles.heroSprinkle} /><span className={styles.heroSprinkleTwo} />
          </div>
        </section>

        <section className={styles.productsSection} id="products">
          <div className={styles.sectionIntro}>
            <div>
              <span className={styles.eyebrow}><span /> THE GOOD STUFF</span>
              <h2>اختار <em>حلاوتك</em></h2>
              <p>كل قطعة ليها طعمها وشخصيتها — إنت بس اختار.</p>
            </div>
            <span className={styles.menuCount}>05 اختيارات لذيذة</span>
          </div>
          <div className={styles.productGrid}>
            {PRODUCTS.map((product) => (
              <article className={styles.productCard} key={product.id}>
                <div className={styles.productVisual}>
                  <span className={styles.productTag}>{product.tag}</span>
                  <CookieArtwork product={product} />
                  <button className={styles.quickAdd} type="button" aria-label={"أضف " + product.name + " إلى السلة"} onClick={() => addToCart(product.id)}><Plus size={21} /></button>
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productTitleRow}><h3>{product.name}</h3><span className={styles.productPrice}>{formatPrice(product.price)}</span></div>
                  <p>{product.subtitle}</p>
                  <button className={styles.addButton} type="button" onClick={() => addToCart(product.id)}>أضف للسلة <ArrowUpLeft size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.promise} id="about">
          <div className={styles.promiseIcon}><Heart size={25} /></div>
          <div className={styles.promiseCopy}>
            <span className={styles.eyebrow}>A LITTLE JOY IN EVERY BITE</span>
            <h2>مش مجرد كوكيز... <em>دي لحظة حلوة.</em></h2>
            <p>بنحب التفاصيل الصغيرة: عجينة مظبوطة، شوكولاتة غنية، وتغليف يوصلّك بنفس إحساس أول ما خرج من الفرن.</p>
          </div>
          <div className={styles.promiseStamp}><span>MADE</span><strong>WITH<br />LOVE</strong><Heart size={19} fill="currentColor" /></div>
        </section>

        <section className={styles.perks}>
          <div><span><Truck size={20} /></span><div><strong>توصيل لحد بابك</strong><small>تكلفة التوصيل حسب منطقتك</small></div></div>
          <div><span><ShieldCheck size={20} /></span><div><strong>طلبك بأمان</strong><small>تأكيد التفاصيل قبل التنفيذ</small></div></div>
          <div><span><ChefHat size={20} /></span><div><strong>طعم معمول بحب</strong><small>دفعات صغيرة واهتمام بالتفاصيل</small></div></div>
        </section>

        <footer className={styles.footer} id="footer">
          <a className={styles.brand} href="#home"><span className={styles.brandMark}><Cookie size={23} /></span><span className={styles.brandWords}><strong>COOKIE CLUB</strong><small>كوكيز على مزاجك</small></span></a>
          <p>خلي يومك أحلى، قطعة ورا قطعة.</p>
          <span className={styles.copyright}>© {new Date().getFullYear()} COOKIE CLUB</span>
        </footer>
      </div>

      {(cartOpen || checkoutOpen) && (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) { setCartOpen(false); setCheckoutOpen(false); }
        }}>
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div className={styles.drawerHead}>
              <div><span className={styles.eyebrow}>{checkoutOpen ? "ONE LAST STEP" : "YOUR SWEET PICKS"}</span><h2 id="drawer-title">{orderComplete ? "طلبك جاهز" : checkoutOpen ? "بيانات التوصيل" : "سلتك الحلوة"}</h2></div>
              <button className={styles.closeButton} onClick={() => { setCartOpen(false); setCheckoutOpen(false); }} type="button" aria-label="إغلاق"><X size={20} /></button>
            </div>

            {orderComplete ? (
              <div className={styles.orderSuccess}>
                <span className={styles.successIcon}><CheckCircle2 size={34} /></span>
                <h3>اتجهز طلبك بنجاح</h3>
                <p>{SHOP_WHATSAPP ? "فتحنا لك واتساب برسالة الطلب. ابعتها عشان نأكد التفاصيل." : "رقم واتساب المتجر لسه مش مربوط. انسخ تفاصيل الطلب واحتفظ بيها لحين إضافة رقم التواصل."}</p>
                <pre className={styles.orderPreview}>{orderText}</pre>
                <button className={styles.primaryButtonFull} onClick={copyOrder} type="button">{copied ? "تم نسخ الطلب" : "انسخ تفاصيل الطلب"}</button>
                <button className={styles.textButton} onClick={() => { setCartOpen(false); setCheckoutOpen(false); setOrderComplete(false); }} type="button">العودة للمنيو</button>
              </div>
            ) : checkoutOpen ? (
              <form className={styles.checkoutForm} onSubmit={placeOrder}>
                <div className={styles.checkoutSummary}><span>إجمالي المنتجات</span><strong>{formatPrice(subtotal)}</strong><small>التوصيل يتم تأكيد تكلفته حسب المنطقة قبل تنفيذ الطلب.</small></div>
                <label>الاسم بالكامل<input name="customerName" autoComplete="name" placeholder="اكتب اسمك" required maxLength={100} /></label>
                <label>رقم الموبايل<input name="phone" autoComplete="tel" inputMode="tel" placeholder="01xxxxxxxxx" required minLength={10} maxLength={15} /></label>
                <label>عنوان التوصيل<textarea name="address" autoComplete="street-address" placeholder="المحافظة، المنطقة، الشارع، رقم العقار..." required rows={3} maxLength={400} /></label>
                <label>ملاحظات إضافية <small>(اختياري)</small><textarea name="notes" placeholder="أي تفاصيل تحب نعرفها؟" rows={2} maxLength={300} /></label>
                <div className={styles.paymentNote}><PackageCheck size={18} /><span>الدفع عند الاستلام — لا يتم تحصيل أي مبلغ أونلاين من الصفحة.</span></div>
                <button className={styles.primaryButtonFull} type="submit">تأكيد وتجهيز الطلب <ArrowLeft size={17} /></button>
                <button className={styles.textButton} type="button" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }}>الرجوع للسلة</button>
              </form>
            ) : (
              <>
                {cartItems.length === 0 ? (
                  <div className={styles.emptyCart}>
                    <span><ShoppingBag size={31} /></span><h3>السلة لسه فاضية</h3><p>اختار حاجة حلوة من المنيو وخلي يومك ألطف.</p>
                    <button className={styles.primaryButtonFull} onClick={() => setCartOpen(false)} type="button">تصفح المنيو</button>
                  </div>
                ) : (
                  <>
                    <div className={styles.cartList}>
                      {cartItems.map((product) => (
                        <div className={styles.cartItem} key={product.id}>
                          <div className={styles.cartThumb + " " + artClasses[product.id]}><Cookie size={25} /></div>
                          <div className={styles.cartItemInfo}>
                            <strong>{product.name}</strong><small>{formatPrice(product.price)} للقطعة</small>
                            <div className={styles.quantityControl}>
                              <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label="تقليل الكمية"><Minus size={14} /></button>
                              <b>{cart[product.id]}</b>
                              <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label="زيادة الكمية"><Plus size={14} /></button>
                            </div>
                          </div>
                          <div className={styles.cartItemEnd}>
                            <strong>{formatPrice(product.price * (cart[product.id] ?? 0))}</strong>
                            <button className={styles.removeButton} type="button" onClick={() => setCart((current) => { const next = { ...current }; delete next[product.id]; return next; })} aria-label={"حذف " + product.name}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.cartFoot}>
                      <div className={styles.subtotalRow}><span>الإجمالي</span><strong>{formatPrice(subtotal)}</strong></div>
                      <small>التوصيل يُحسب حسب المنطقة ويُؤكد قبل تنفيذ الطلب.</small>
                      <button className={styles.primaryButtonFull} onClick={openCheckout} type="button">استكمال الطلب <ArrowLeft size={17} /></button>
                      <button className={styles.textButton} onClick={() => setCartOpen(false)} type="button">متابعة التسوق</button>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
