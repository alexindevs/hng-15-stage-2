import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Body, Button, Eyebrow, H1, Loading, Screen } from "../components/ui";
import { assetUrl } from "../lib/format";
import { fetchProducts, type Product } from "../lib/products";
import { colors, fonts, radius } from "../theme";

export default function GalleryScreen({ navigation }: { navigation: any }) {
  const { width, height } = useWindowDimensions();
  const [items, setItems] = useState<Product[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts().then((all) => setItems(all.filter((p) => p.image_url)));
  }, []);
  if (!items) return <Loading />;
  const cur = open === null ? null : items[open];
  const tile = (width - 16 * 2 - 10) / 2;

  return (
    <Screen>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(p) => p.slug}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 8, marginBottom: 10 }}>
            <Eyebrow>Gallery</Eyebrow>
            <H1>The lot, up close.</H1>
            <Body>Tap any photo to enlarge it, then jump to the listing.</Body>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable onPress={() => setOpen(index)} style={{ width: tile, height: tile * 0.85, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.line }}>
            <Image source={assetUrl(item.image_url)} contentFit="cover" style={StyleSheet.absoluteFill} />
          </Pressable>
        )}
      />
      <Modal visible={!!cur} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={s.modal}>
          <View style={s.top}>
            <Text style={s.cap}>{cur?.name}</Text>
            <Button title="Close" variant="ghost" onPress={() => setOpen(null)} style={{ minHeight: 36, paddingHorizontal: 16 }} />
          </View>
          <FlatList
            data={items}
            horizontal
            pagingEnabled
            initialScrollIndex={open ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setOpen(Math.round(e.nativeEvent.contentOffset.x / width))}
            keyExtractor={(p) => p.slug}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, height: height * 0.7, justifyContent: "center" }}>
                <Image source={assetUrl(item.image_url)} contentFit="contain" style={{ width, height: height * 0.6 }} />
              </View>
            )}
          />
          {cur && (
            <View style={{ padding: 16 }}>
              <Button
                title="View this vehicle"
                onPress={() => {
                  setOpen(null);
                  navigation.navigate("Product", { slug: cur.slug });
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", paddingTop: 48 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  cap: { fontFamily: fonts.display, fontSize: 18, color: colors.bone, flex: 1 },
});
