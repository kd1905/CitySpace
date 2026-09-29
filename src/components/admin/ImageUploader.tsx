import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius } from '@/constants/layout';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 12,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleAddUrl = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || inputUrl).trim();
    if (!targetUrl) {
      setUrlError('Please enter a valid image URL');
      return;
    }

    if (images.includes(targetUrl)) {
      setUrlError('This image has already been added');
      return;
    }

    if (images.length >= maxImages) {
      setUrlError(`Maximum limit of ${maxImages} images reached`);
      return;
    }

    onChange([...images, targetUrl]);
    setInputUrl('');
    setUrlError('');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const selected = updated.splice(index, 1)[0];
    updated.unshift(selected);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* Top Input Row */}
      <View style={styles.inputCard}>
        <Text style={styles.fieldLabel}>ADD PROPERTY IMAGE URL</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Feather name="image" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Paste direct HTTPS image link (e.g. Unsplash, CDN)..."
              placeholderTextColor="#94A3B8"
              value={inputUrl}
              onChangeText={(text) => {
                setInputUrl(text);
                setUrlError('');
              }}
              style={styles.urlInput}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleAddUrl()}
            style={styles.addBtn}
          >
            <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add Image</Text>
          </TouchableOpacity>
        </View>

        {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}


      </View>

      {/* Gallery & Reordering Grid */}
      <View style={styles.gallerySection}>
        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>
            PROPERTY GALLERY ({images.length} / {maxImages})
          </Text>
          <Text style={styles.reorderHint}>
            First image is the Primary Cover photo. Use arrows to reorder.
          </Text>
        </View>

        {images.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Feather name="image" size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No images uploaded yet</Text>
            <Text style={styles.emptySubtitle}>
              Add image URLs above or pick from presets to display high-resolution photos of the space.
            </Text>
          </View>
        ) : (
          <View style={styles.imageGrid}>
            {images.map((imgUrl, index) => {
              const isCover = index === 0;
              return (
                <View key={imgUrl + index} style={[styles.imageCard, isCover && styles.imageCardCover]}>
                  {/* Image Preview */}
                  <Image source={{ uri: imgUrl }} style={styles.previewImage} />

                  {/* Badge */}
                  <View style={[styles.orderBadge, isCover && styles.coverBadge]}>
                    <Text style={[styles.orderBadgeText, isCover && styles.coverBadgeText]}>
                      {isCover ? 'Cover Photo' : `#${index + 1}`}
                    </Text>
                  </View>

                  {/* Controls / Reorder Bar */}
                  <View style={styles.cardActions}>
                    <View style={styles.reorderGroup}>
                      {index > 0 && (
                        <TouchableOpacity
                          onPress={() => handleMoveLeft(index)}
                          style={styles.iconBtn}
                        >
                          <Feather name="chevron-left" size={15} color="#334155" />
                        </TouchableOpacity>
                      )}
                      {index < images.length - 1 && (
                        <TouchableOpacity
                          onPress={() => handleMoveRight(index)}
                          style={styles.iconBtn}
                        >
                          <Feather name="chevron-right" size={15} color="#334155" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.rightActionsGroup}>
                      {!isCover && (
                        <TouchableOpacity
                          onPress={() => handleSetPrimary(index)}
                          style={styles.setCoverBtn}
                        >
                          <Text style={styles.setCoverText}>Set Cover</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleRemove(index)}
                        style={styles.deleteBtn}
                      >
                        <Feather name="trash-2" size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  inputContainer: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: BorderRadius.sm,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },

  gallerySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  galleryHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  reorderHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 380,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  imageCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  imageCardCover: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  previewImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coverBadge: {
    backgroundColor: Colors.primary,
  },
  coverBadgeText: {
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  reorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  setCoverBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  setCoverText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
});
