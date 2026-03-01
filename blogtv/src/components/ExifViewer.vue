<template>
  <div class="exif-viewer">
    <h3>EXIF Information</h3>

    <div v-if="loading" class="loading">Loading EXIF data...</div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="exifData" class="exif-data">
      <p><strong>Photo taken on:</strong> {{ exifData.timestamp || 'Not available' }}</p>
      <p><strong>GPS Datestamp:</strong> {{ exifData.gpsDateStamp || 'Not available' }}</p>
      <p><strong>Latitude:</strong> {{ exifData.latitude || 'Not available' }}</p>
      <p><strong>Longitude:</strong> {{ exifData.longitude || 'Not available' }}</p>
      <p><strong>Software:</strong> {{ exifData.software || 'Not available' }}</p>
      <p><strong>Make:</strong> {{ exifData.make || 'Not available' }}</p>
      <p><strong>Model:</strong> {{ exifData.model || 'Not available' }}</p>
    </div>

    <p v-if="!loading && !exifData && !error">No EXIF data found in this image.</p>
  </div>
</template>

<script>
import exifr from 'exifr'

export default {
  name: 'ExifViewer',
  props: {
    initialImageUrl: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      loading: false,
      error: null,
      exifData: null,
    }
  },
  watch: {
    initialImageUrl: {
      immediate: true,
      handler(newUrl) {
        if (newUrl) {
          this.fetchImage(newUrl)
        }
      },
    },
  },
  methods: {
    async fetchImage(url) {
      if (!url) {
        this.error = 'No image URL provided'
        return
      }

      this.loading = true
      this.error = null
      this.exifData = null

      try {
        const imgData = await exifr.parse(url, { gps: true, tiff: true }) // Parse EXIF data from the image URL
        this.loading = false

        if (!imgData) {
          this.exifData = null
          return
        }

        // Log the raw EXIF metadata object to the console
        console.log('Raw Metadata:', imgData)

        // Extract timestamp
        const timestamp = imgData.CreateDate || 'Created Date not available'

        // Extract GPS data
        const latitude = imgData.latitude?.toFixed(6) || 'Not available'
        const longitude = imgData.longitude?.toFixed(6) || 'Not available'

        // Extract More INformation
        const gpsDateStamp = imgData.GPSDateStamp || imgData.GPSTimeStamp
        const software = imgData.Software;
        const make = imgData.Make;
        const model = imgData.Model;

        this.exifData = {
          timestamp: timestamp || 'Not available',
          latitude,
          longitude,
          gpsDateStamp,
          software,
          make,
          model,
        }
      } catch (error) {
        this.loading = false
        this.error = `Error extracting EXIF data: ${error.message}`
      }
    },
  },
}
</script>

<style scoped>

.loading,
.error {
  margin: 10px 0;
  padding: 8px;
  border-radius: 4px;
}

.loading {
  background-color: #f8f9fa;
  color: #6c757d;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

.exif-data {
  margin-top: 10px;
}

.exif-data p {
  margin: 5px 0;
  font-size: .7em
}
</style>
