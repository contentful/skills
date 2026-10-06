# Images API

The Images API transforms images on-the-fly via URL parameters. No authentication required.

## Table of Contents
- [Base URL](#base-url)
- [URL Format](#url-format)
- [Resize](#resize)
- [Fit Modes](#fit-modes)
- [Focus Area](#focus-area)
- [Format Conversion](#format-conversion)
- [Quality](#quality)
- [Other Parameters](#other-parameters)
- [Combining Parameters](#combining-parameters)

## Base URL

- **US**: `https://images.ctfassets.net`
- **EU**: `https://images.eu.ctfassets.net`

No authentication is needed. The URL from an asset's `file.url` field already points to this host.

## URL Format

```
https://images.ctfassets.net/{space_id}/{asset_id}/{unique_token}/{filename}?{parameters}
```

The full URL is returned in asset responses as `fields.file.url` (prefixed with `//`).

## Resize

```bash
# Set width (height auto-scales)
...?w=300

# Set height (width auto-scales)
...?h=200

# Set both (behavior depends on fit mode)
...?w=300&h=200
```

Maximum dimension: 4000px.

## Fit Modes

Control how the image fits within the specified dimensions:

| Mode | Description |
|------|-------------|
| `pad` | Resize to fit within dimensions, pad remaining space with background color |
| `fill` | Resize to fill dimensions, crop overflow |
| `scale` | Resize to fit within dimensions, no cropping or padding |
| `crop` | Crop to exact dimensions from center (or focus area) |
| `thumb` | Thumbnail — smart crop using focus area detection |

```bash
# Pad with white background
...?w=300&h=200&fit=pad&bg=rgb:ffffff

# Fill (crop overflow)
...?w=300&h=200&fit=fill

# Scale to fit
...?w=300&fit=scale

# Crop from center
...?w=300&h=200&fit=crop

# Smart thumbnail
...?w=150&h=150&fit=thumb&f=face
```

## Focus Area

Control the focal point for `fit=crop`, `fit=fill`, and `fit=thumb`:

| Value | Description |
|-------|-------------|
| `center` | Center of image (default) |
| `top` | Top edge |
| `right` | Right edge |
| `bottom` | Bottom edge |
| `left` | Left edge |
| `top_right` | Top-right corner |
| `top_left` | Top-left corner |
| `bottom_right` | Bottom-right corner |
| `bottom_left` | Bottom-left corner |
| `face` | Detected face (auto) |
| `faces` | All detected faces (auto) |

```bash
# Crop focusing on faces
...?w=300&h=300&fit=thumb&f=faces

# Crop from top
...?w=800&h=400&fit=crop&f=top
```

## Format Conversion

Convert between image formats:

```bash
# Convert to WebP
...?fm=webp

# Convert to AVIF
...?fm=avif

# Convert to PNG
...?fm=png

# Convert to JPEG
...?fm=jpg

# Convert to progressive JPEG
...?fm=jpg&fl=progressive

# Convert to 8-bit PNG
...?fm=png&fl=png8
```

Supported formats: `jpg`, `png`, `webp`, `gif`, `avif`.

## Quality

Control JPEG/WebP/AVIF compression quality (1-100):

```bash
# 80% quality (good balance of size and visual quality)
...?q=80

# Lower quality, smaller file
...?q=50

# High quality
...?q=95
```

Default quality varies by format. Only applies to `jpg`, `webp`, and `avif`.

## Other Parameters

### Border radius

```bash
# Round corners (max: half of smallest dimension for circle)
...?r=20

# Full circle (use with equal w and h)
...?w=200&h=200&fit=fill&r=max
```

### Background color (for `fit=pad`)

```bash
# RGB hex
...?fit=pad&w=300&h=200&bg=rgb:ff0000

# With transparency (for PNG)
...?fit=pad&w=300&h=200&bg=rgb:00000000
```

## Combining Parameters

Chain multiple transformations:

```bash
# Responsive hero image: 800px wide, WebP, 80% quality
https://images.ctfassets.net/{space}/{id}/{token}/hero.jpg?w=800&fm=webp&q=80

# Thumbnail: 150x150, smart crop on faces, WebP
https://images.ctfassets.net/{space}/{id}/{token}/photo.jpg?w=150&h=150&fit=thumb&f=faces&fm=webp&q=80

# Padded product image: 400x400, white background, PNG
https://images.ctfassets.net/{space}/{id}/{token}/product.png?w=400&h=400&fit=pad&bg=rgb:ffffff

# Avatar circle: 100x100
https://images.ctfassets.net/{space}/{id}/{token}/avatar.jpg?w=100&h=100&fit=fill&f=face&r=max&fm=webp
```

## Best Practices

1. **Use WebP/AVIF** — significantly smaller files than JPEG/PNG
2. **Set appropriate quality** — `q=80` is usually sufficient
3. **Resize on delivery** — don't upload pre-sized variants
4. **Use `fit=fill`** for fixed-size containers
5. **Use `f=faces`** for profile photos and portraits
6. **Serve responsive images** — use different `w` values per breakpoint
