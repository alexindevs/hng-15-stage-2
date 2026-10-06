import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Body, Button, Eyebrow, H2, Screen } from "../components/ui";
import { assetUrl, formatNaira } from "../lib/format";
import { api } from "../lib/api";
import { fetchProducts, type Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";

// Copy and structure mirror hng-15-stage-1/src/app/(site)/page.tsx.
const CATEGORIES = [
  { name: "Cars", blurb: "Saloons and coupes", img: "/vehicles/cutouts/sedan-white-mercedes.webp" },
  { name: "SUVs & Trucks", blurb: "Family haulers, off-roaders, pickups", img: "/vehicles/cutouts/suv-white-fortuner.webp" },
  { name: "Motorcycles", blurb: "Commuters to sports bikes", img: "/vehicles/cutouts/moto-tvs-apache.webp" },
  { name: "Bicycles", blurb: "Trail and town", img: "/vehicles/cutouts/bicycle-trek-800.webp" },
];
const REASONS = [
  { n: "01", t: "Honest listings", d: "Every listing shows the price, year, mileage and condition up front. No “call for price”." },
  { n: "02", t: "See it before you buy", d: "Book a viewing slot online and inspect the vehicle in person before you commit." },
  { n: "03", t: "Pay your way", d: "Pay online with Paystack, by bank transfer, or on delivery. Your choice at checkout." },
];
const STEPS = [
  { n: "1", t: "Browse", d: "Filter by category, price and year to find what fits." },
  { n: "2", t: "Book a viewing", d: "Pick a date and time that suits you. We confirm the slot." },
  { n: "3", t: "Inspect", d: "Come and look it over, take it for a spin, ask anything." },
  { n: "4", t: "Drive away", d: "Settle payment and collect your vehicle with all documents." },
];
const FAQ = [
  { q: "Can I see a vehicle before paying?", a: "Yes. Book a viewing from the vehicle page, choose a slot, and we will confirm it. You can inspect the vehicle in person before any purchase." },
  { q: "What is the inspection fee?", a: "Each viewing carries a {FEE} inspection fee, which you can pay when you book or at the viewing. The inspection fee is non-refundable." },
  { q: "How do I pay?", a: "Online with Paystack, by bank transfer, or on delivery. The options are shown at checkout." },
  { q: "Are the prices negotiable?", a: "Prices are shown on every listing. If you have a question about a price, ask us when you book your viewing." },
  { q: "Do you deliver?", a: "We can arrange delivery. Tell us your city when you order and we will confirm the details." },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<Product[]>([]);
  const [fee, setFee] = useState(2_000_000);
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    fetchProducts().then(setItems);
    api.config().then((c) => setFee(c.inspection_fee_kobo)).catch(() => {});
  }, []);

  const slides = items.filter((p) => p.cutout_url);
  const featured = items.filter((p) => p.stock > 0).slice(0, 6);
  const slideW = width * 0.82;
  const go = (name: string, params?: object) => navigation.navigate(name, params);

  return (
    <Screen>
      <ScrollView>
        {/* HERO: gold wordmark behind a swipeable carousel of background-removed vehicles */}
        <View style={s.hero}>
          <Text style={s.word}>EGO</Text>
          <Text style={[s.word, { marginTop: -18 }]}>OLISA</Text>
          {slides.length > 0 && (
            <FlatList
              data={slides}
              horizontal
              pagingEnabled={false}
              snapToInterval={slideW}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.slug}
              style={{ marginTop: 18 }}
              contentContainerStyle={{ paddingHorizontal: (width - slideW) / 2 }}
              onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / slideW))}
              renderItem={({ item }) => (
                <Pressable onPress={() => go("Product", { slug: item.slug })} style={{ width: slideW, alignItems: "center" }}>
                  <Image source={assetUrl(item.cutout_url)} contentFit="contain" style={{ width: slideW, height: slideW * 0.62 }} />
                  <Text style={s.slideName}>{item.name}</Text>
                  <Text style={s.slideMeta}>{[item.year, item.condition].filter(Boolean).join(" · ")}</Text>
                  <Text style={s.slidePrice}>{formatNaira(item.price_kobo)}</Text>
                </Pressable>
              )}
            />
          )}
          {slides.length > 1 && (
            <View style={s.dots}>
              {slides.map((p, i) => <View key={p.slug} style={[s.dot, i === slide && { backgroundColor: colors.gold, width: 18 }]} />)}
            </View>
          )}
          <View style={s.heroCtas}>
            <Button title="Browse vehicles" onPress={() => go("Shop")} />
            <Button title="Book a viewing" variant="ghost" onPress={() => go("Book")} />
          </View>
        </View>

        {/* CATEGORIES */}
        <View style={s.section}>
          <Eyebrow>Shop by type</Eyebrow>
          <H2 style={{ marginTop: 6 }}>Find your ride</H2>
          <View style={s.grid}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.name} style={s.catTile} onPress={() => go("Shop", { category: c.name })}>
                <Eyebrow>{c.blurb}</Eyebrow>
                <Image source={assetUrl(c.img)} contentFit="contain" style={s.catImg} />
                <Text style={s.catName}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* WHY */}
        <View style={[s.section, s.band]}>
          <Eyebrow>Why Ego Olisa</Eyebrow>
          <H2 style={{ marginTop: 6 }}>Buying a vehicle should feel straightforward.</H2>
          <View style={{ gap: 12, marginTop: 20 }}>
            {REASONS.map((r) => (
              <View key={r.n} style={s.reason}>
                <Text style={s.gold}>{r.n}</Text>
                <Text style={s.reasonT}>{r.t}</Text>
                <Body style={{ fontSize: 14, lineHeight: 21 }}>{r.d}</Body>
              </View>
            ))}
          </View>
        </View>

        {/* LATEST ARRIVALS */}
        <View style={s.section}>
          <Eyebrow>In stock</Eyebrow>
          <H2 style={{ marginTop: 6, marginBottom: 16 }}>Latest arrivals</H2>
          <View style={{ gap: 16 }}>
            {featured.map((p) => <ProductCard key={p.slug} p={p} onPress={() => go("Product", { slug: p.slug })} />)}
          </View>
          <Button title="View all" variant="ghost" onPress={() => go("Shop")} style={{ marginTop: 16 }} />
        </View>

        {/* PHOTO BAND */}
        <View style={[s.photo, { marginHorizontal: 16 }]}>
          <Image source={assetUrl("/vehicles/suv-dusk.jpg")} contentFit="cover" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.58)" }]} />
          <View style={{ padding: 24, gap: 10 }}>
            <Eyebrow gold>Viewings by appointment</Eyebrow>
            <Text style={s.photoH}>See it in person before you decide.</Text>
            <Text style={s.photoP}>Pick a slot, come by, and inspect the vehicle with no pressure.</Text>
            <Button title="Choose a vehicle" onPress={() => go("Shop")} style={{ alignSelf: "flex-start", marginTop: 6 }} />
          </View>
        </View>

        {/* HOW IT WORKS (light "paper" section) */}
        <View style={s.paper}>
          <Eyebrow dark>How it works</Eyebrow>
          <Text style={s.paperH}>From browsing to the keys in four steps.</Text>
          <View style={{ marginTop: 20 }}>
            {STEPS.map((st) => (
              <View key={st.n} style={s.step}>
                <Text style={s.stepN}>{st.n}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepT}>{st.t}</Text>
                  <Text style={s.stepD}>{st.d}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={s.section}>
          <Eyebrow>Questions</Eyebrow>
          <H2 style={{ marginTop: 6, marginBottom: 8 }}>Good to know.</H2>
          {FAQ.map((f, i) => (
            <Pressable key={f.q} onPress={() => setOpen(open === i ? null : i)} style={s.faq}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={s.faqQ}>{f.q}</Text>
                <Text style={{ color: colors.gold, fontSize: 20 }}>{open === i ? "−" : "+"}</Text>
              </View>
              {open === i && <Body style={{ marginTop: 8, fontSize: 14, lineHeight: 21 }}>{f.a.replace("{FEE}", formatNaira(fee))}</Body>}
            </Pressable>
          ))}
        </View>

        {/* CLOSING CTA */}
        <View style={s.cta}>
          <Text style={s.ctaH}>Ready to find yours?</Text>
          <Body style={{ textAlign: "center" }}>Browse the full stock, or sign in to track your orders.</Body>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <Button title="Browse vehicles" onPress={() => go("Shop")} />
            <Button title="Account" variant="ghost" onPress={() => go("Account")} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: "#15110a", paddingTop: 22, paddingBottom: 22, alignItems: "center" },
  word: { fontFamily: fonts.display, fontSize: 84, lineHeight: 86, letterSpacing: -2, color: colors.gold, opacity: 0.5 },
  slideName: { fontFamily: fonts.display, fontSize: 22, color: colors.bone, marginTop: 6 },
  slideMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.mute, marginTop: 2 },
  slidePrice: { fontFamily: fonts.semi, fontSize: 17, color: colors.gold, marginTop: 4 },
  dots: { flexDirection: "row", gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(244,241,234,0.3)" },
  heroCtas: { flexDirection: "column", gap: 12, paddingHorizontal: 16, marginTop: 22, width: "100%" },
  section: { paddingHorizontal: 16, paddingVertical: 36 },
  band: { backgroundColor: colors.coal, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  catTile: { width: "48.5%", aspectRatio: 0.82, backgroundColor: colors.panel, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 12, justifyContent: "space-between" },
  catImg: { position: "absolute", left: 8, right: 8, top: "28%", height: "42%" },
  catName: { fontFamily: fonts.display, fontSize: 20, color: colors.bone },
  gold: { fontFamily: fonts.display, color: colors.gold },
  reason: { backgroundColor: colors.ink, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 20, gap: 8 },
  reasonT: { fontFamily: fonts.display, fontSize: 20, color: colors.bone },
  photo: { borderRadius: radius.panel, overflow: "hidden", justifyContent: "center", minHeight: 300 },
  photoH: { fontFamily: fonts.display, fontSize: 30, color: colors.bone, letterSpacing: -0.5 },
  photoP: { fontFamily: fonts.body, fontSize: 14, color: "rgba(244,241,234,0.75)" },
  paper: { backgroundColor: colors.bone, marginTop: 36, padding: 20, paddingVertical: 40 },
  paperH: { fontFamily: fonts.display, fontSize: 30, color: colors.paperInk, marginTop: 8, letterSpacing: -0.5 },
  step: { flexDirection: "row", gap: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(22,20,15,0.15)" },
  stepN: { fontFamily: fonts.display, fontSize: 40, color: "rgba(22,20,15,0.25)", width: 36 },
  stepT: { fontFamily: fonts.display, fontSize: 20, color: colors.paperInk },
  stepD: { fontFamily: fonts.body, fontSize: 14, color: "rgba(22,20,15,0.7)", marginTop: 4, lineHeight: 20 },
  faq: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  faqQ: { fontFamily: fonts.semi, fontSize: 16, color: colors.bone, flex: 1 },
  cta: { alignItems: "center", padding: 32, paddingVertical: 56, backgroundColor: "#15110a", borderTopWidth: 1, borderTopColor: colors.line, gap: 10 },
  ctaH: { fontFamily: fonts.display, fontSize: 32, color: colors.bone, textAlign: "center", letterSpacing: -0.5 },
});
