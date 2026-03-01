<template>
  <div class="azure-vision-viewer">
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="azure-eye">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Analyzing image...</p>
      </div>
      <div v-else-if="azResult" class="azeye-data">
        <h3>Analysis Results</h3>
        <p><strong>Description:</strong> {{ azResult.description }}</p>
        <p><strong>Tags:</strong> {{ azResult.tags.join(', ') }}</p>
        <div v-if="azResult.objects.length > 0">
          <table>
            <thead>
              <tr>
                <th>Object</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="obj in azResult.objects" :key="obj.object">
                <td>{{ obj.object }}</td>
                <td>{{ obj.confidence }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="azResult.faces.length > 0">
          <p><strong>Faces detected:</strong></p>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(face, index) in azResult.faces" :key="index">
                <td>{{ face.faceRectangle.left }}, {{ face.faceRectangle.top }}</td>
                <td>(width: {{ face.faceRectangle.width }}, height: {{ face.faceRectangle.height }})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'
import { FaceClient } from '@azure/cognitiveservices-face'
import { ApiKeyCredentials } from '@azure/ms-rest-js'

// Computer Vision credentials
const azkey = import.meta.env.VITE_AZ_KEY || ''
const endpoint = 'https://blogt-eye.cognitiveservices.azure.com/'

// Face API credentials
const faceKey = import.meta.env.VITE_FACE_KEY || ''
const faceEndpoint = 'https://blogt-faces.cognitiveservices.azure.com/'

export default {
  name: 'AzureViewer',
  props: {
    initialImageUrl: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      computerVisionClient: null,
      faceClient: null,
      azResult: null, // Holds the analysis result
      loading: false, // Controls the loading state
      error: null, // Holds any error messages
    }
  },

  watch: {
    initialImageUrl: {
      immediate: true,
      handler(newUrl) {
        if (newUrl) {
          this.computerVisionClient = new ComputerVisionClient(
            new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': azkey } }),
            endpoint,
          )
          this.faceClient = new FaceClient(
            new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': faceKey } }),
            faceEndpoint,
          )
          this.analyzeImage(newUrl)
        } else {
          console.error('No image URL provided')
        }
      },
    },
  },

  methods: {
    async analyzeImage(url) {
      // Set loading state to true before starting analysis
      this.loading = true
      console.log('Analyzing image:', url)

      try {
        // Analyze image features
        const features = ['Description', 'Tags', 'Objects']

        console.log(this.computerVisionClient)
        console.log(this.faceClient)

        const azResult = await this.computerVisionClient.analyzeImage(url, {
          visualFeatures: features,
        })

        console.log('Analysis result:', azResult)
        // Check if the analysis result is empty
        if (!azResult || !azResult.description) {
          this.error = 'No analysis result found'
          return
        }

        // Use the read API for text extraction
        const textResult = await this.computerVisionClient.read(url)
        const operationId = textResult.operationLocation.split('/').pop()

        let readResults
        let status
        // Polling the read result until it's done
        do {
          readResults = await this.computerVisionClient.getReadResult(operationId)
          status = readResults.status
          console.log('Computer Vision Read status:', status)

          if (status === 'notStarted' || status === 'running') {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } while (status === 'notStarted' || status === 'running')

        // Extract text content
        if (status === 'succeeded') {
          console.log('Read result status:', status)
          azResult.extractedText = readResults.analyzeResult.readResults
            .flatMap((page) => page.lines)
            .map((line) => line.text)
            .join(' ')
        }

        // Analyze faces using the Face API client
        const faceResults = await this.faceClient.face.detectWithUrl(url, {
          returnFaceId: false,
          returnFaceLandmarks: false,
          recognitionModel: 'recognition_01',
          detectionModel: 'detection_01',
        })

        azResult.faces = faceResults.map((face) => ({
          faceRectangle: face.faceRectangle,
        }))

        // Save the analysis result to display in the template
        this.azResult = {
          description: azResult.description.captions.map((caption) => caption.text).join(', '),
          tags: azResult.tags.map((tag) => tag.name),
          objects: azResult.objects,
          faces: azResult.faces,
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        // Set loading state to false after analysis completes (whether successful or not)
        this.loading = false
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

.azeye-data {
  margin-top: 10px;
}

.azeye-data p {
  margin: 5px 0;
  font-size: .7em
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: .7em
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f4f4f4;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}

caption {
  font-size: 0.8em;
  margin-bottom: 10px;
  font-weight: bold;
}

</style>
