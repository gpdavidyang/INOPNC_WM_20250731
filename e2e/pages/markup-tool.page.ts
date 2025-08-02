import { expect, Locator } from '@playwright/test'
import { BasePage } from './base.page'

export class MarkupToolPage extends BasePage {
  readonly pageHeader: Locator
  readonly newMarkupButton: Locator
  readonly documentsList: Locator
  readonly searchInput: Locator
  readonly filterDropdown: Locator
  readonly viewModeToggle: Locator

  // Document list elements
  readonly documentCards: Locator
  readonly documentTitles: Locator
  readonly documentPreviews: Locator
  readonly openButtons: Locator
  readonly editButtons: Locator
  readonly deleteButtons: Locator

  // Editor elements
  readonly canvas: Locator
  readonly toolPalette: Locator
  readonly topToolbar: Locator
  readonly bottomStatusbar: Locator
  readonly blueprintImage: Locator

  // Tool palette buttons
  readonly selectTool: Locator
  readonly boxTool: Locator
  readonly textTool: Locator
  readonly penTool: Locator
  readonly colorPicker: Locator
  readonly undoButton: Locator
  readonly redoButton: Locator
  readonly clearButton: Locator

  // Top toolbar buttons
  readonly homeButton: Locator
  readonly openButton: Locator
  readonly saveButton: Locator
  readonly shareButton: Locator
  readonly zoomInButton: Locator
  readonly zoomOutButton: Locator
  readonly fitToScreenButton: Locator

  // Upload elements
  readonly uploadArea: Locator
  readonly fileInput: Locator
  readonly uploadButton: Locator
  readonly dragDropZone: Locator

  // Save dialog elements
  readonly saveDialog: Locator
  readonly titleInput: Locator
  readonly descriptionInput: Locator
  readonly locationSelect: Locator
  readonly siteSelect: Locator
  readonly saveConfirmButton: Locator
  readonly saveCancelButton: Locator

  // Open dialog elements
  readonly openDialog: Locator
  readonly documentGrid: Locator
  readonly openConfirmButton: Locator
  readonly openCancelButton: Locator

  // Share dialog elements
  readonly shareDialog: Locator
  readonly shareUrlInput: Locator
  readonly copyLinkButton: Locator
  readonly emailInput: Locator
  readonly shareEmailButton: Locator

  constructor(page: any) {
    super(page)
    this.pageHeader = this.getByRole('heading', { name: /도면 마킹|markup tool/i })
    this.newMarkupButton = this.getByRole('button', { name: /새 마킹|new markup/i })
    this.documentsList = this.getByTestId('documents-list')
    this.searchInput = this.getByPlaceholder(/search documents/i)
    this.filterDropdown = this.getByTestId('filter-dropdown')
    this.viewModeToggle = this.getByTestId('view-mode-toggle')

    // Document list
    this.documentCards = this.getByTestId('document-card')
    this.documentTitles = this.getByTestId('document-title')
    this.documentPreviews = this.getByTestId('document-preview')
    this.openButtons = this.getByRole('button', { name: /open|열기/i })
    this.editButtons = this.getByRole('button', { name: /edit|편집/i })
    this.deleteButtons = this.getByRole('button', { name: /delete|삭제/i })

    // Editor
    this.canvas = this.getByTestId('markup-canvas')
    this.toolPalette = this.getByTestId('tool-palette')
    this.topToolbar = this.getByTestId('top-toolbar')
    this.bottomStatusbar = this.getByTestId('bottom-statusbar')
    this.blueprintImage = this.getByTestId('blueprint-image')

    // Tools
    this.selectTool = this.getByTestId('select-tool')
    this.boxTool = this.getByTestId('box-tool')
    this.textTool = this.getByTestId('text-tool')
    this.penTool = this.getByTestId('pen-tool')
    this.colorPicker = this.getByTestId('color-picker')
    this.undoButton = this.getByTestId('undo-button')
    this.redoButton = this.getByTestId('redo-button')
    this.clearButton = this.getByTestId('clear-button')

    // Top toolbar
    this.homeButton = this.getByTestId('home-button')
    this.openButton = this.getByTestId('open-button')
    this.saveButton = this.getByTestId('save-button')
    this.shareButton = this.getByTestId('share-button')
    this.zoomInButton = this.getByTestId('zoom-in-button')
    this.zoomOutButton = this.getByTestId('zoom-out-button')
    this.fitToScreenButton = this.getByTestId('fit-to-screen-button')

    // Upload
    this.uploadArea = this.getByTestId('upload-area')
    this.fileInput = this.getByTestId('file-input')
    this.uploadButton = this.getByRole('button', { name: /upload|업로드/i })
    this.dragDropZone = this.getByTestId('drag-drop-zone')

    // Dialogs
    this.saveDialog = this.getByTestId('save-dialog')
    this.titleInput = this.getByLabel(/title|제목/i)
    this.descriptionInput = this.getByLabel(/description|설명/i)
    this.locationSelect = this.getByLabel(/location|위치/i)
    this.siteSelect = this.getByLabel(/site|현장/i)
    this.saveConfirmButton = this.getByRole('button', { name: /save|저장/i })
    this.saveCancelButton = this.getByRole('button', { name: /cancel|취소/i })

    this.openDialog = this.getByTestId('open-dialog')
    this.documentGrid = this.getByTestId('document-grid')
    this.openConfirmButton = this.getByRole('button', { name: /open|열기/i })
    this.openCancelButton = this.getByRole('button', { name: /cancel|취소/i })

    this.shareDialog = this.getByTestId('share-dialog')
    this.shareUrlInput = this.getByTestId('share-url-input')
    this.copyLinkButton = this.getByRole('button', { name: /copy link|링크 복사/i })
    this.emailInput = this.getByLabel(/email|이메일/i)
    this.shareEmailButton = this.getByRole('button', { name: /send email|이메일 전송/i })
  }

  async navigateToMarkupTool() {
    await this.goto('/dashboard/markup')
  }

  async createNewMarkup() {
    await this.newMarkupButton.click()
    await this.waitForUrl('**/markup/editor')
  }

  async uploadBlueprint(filePath: string) {
    await this.fileInput.setInputFiles(filePath)
    // Or drag and drop
    // await this.dragDropZone.dragAndDrop(filePath)
    await this.waitForLoadState()
  }

  async uploadBlueprintViaButton(filePath: string) {
    await this.uploadButton.click()
    await this.fileInput.setInputFiles(filePath)
    await this.waitForLoadState()
  }

  async selectTool(tool: 'select' | 'box' | 'text' | 'pen') {
    switch (tool) {
      case 'select':
        await this.selectTool.click()
        break
      case 'box':
        await this.boxTool.click()
        break
      case 'text':
        await this.textTool.click()
        break
      case 'pen':
        await this.penTool.click()
        break
    }
  }

  async selectColor(color: string) {
    await this.colorPicker.click()
    await this.page.getByRole('option', { name: color }).click()
  }

  async drawBox(x: number, y: number, width: number, height: number) {
    await this.selectTool('box')
    
    // Draw box on canvas
    await this.canvas.click({ position: { x, y } })
    await this.page.mouse.down()
    await this.page.mouse.move(x + width, y + height)
    await this.page.mouse.up()
  }

  async addText(x: number, y: number, text: string) {
    await this.selectTool('text')
    
    // Click on canvas to add text
    await this.canvas.click({ position: { x, y } })
    
    // Type text
    const textInput = this.page.getByTestId('text-input')
    await textInput.fill(text)
    await textInput.press('Enter')
  }

  async drawWithPen(points: Array<{ x: number; y: number }>) {
    await this.selectTool('pen')
    
    // Start drawing
    await this.canvas.click({ position: points[0] })
    await this.page.mouse.down()
    
    // Draw through points
    for (const point of points.slice(1)) {
      await this.page.mouse.move(point.x, point.y)
    }
    
    await this.page.mouse.up()
  }

  async undo() {
    await this.undoButton.click()
  }

  async redo() {
    await this.redoButton.click()
  }

  async clearAll() {
    await this.clearButton.click()
    
    // Confirm if dialog appears
    const confirmButton = this.page.getByRole('button', { name: /confirm|확인/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
  }

  async zoomIn() {
    await this.zoomInButton.click()
  }

  async zoomOut() {
    await this.zoomOutButton.click()
  }

  async fitToScreen() {
    await this.fitToScreenButton.click()
  }

  async saveDocument(metadata: {
    title: string
    description?: string
    location?: string
    site?: string
  }) {
    await this.saveButton.click()
    await expect(this.saveDialog).toBeVisible()
    
    await this.titleInput.fill(metadata.title)
    
    if (metadata.description) {
      await this.descriptionInput.fill(metadata.description)
    }
    
    if (metadata.location) {
      await this.locationSelect.selectOption(metadata.location)
    }
    
    if (metadata.site) {
      await this.siteSelect.selectOption(metadata.site)
    }
    
    await this.saveConfirmButton.click()
    await this.waitForLoadState()
  }

  async openDocument(documentTitle: string) {
    await this.openButton.click()
    await expect(this.openDialog).toBeVisible()
    
    // Find and select document
    const documentCard = this.documentGrid.getByText(documentTitle)
    await documentCard.click()
    
    await this.openConfirmButton.click()
    await this.waitForLoadState()
  }

  async shareDocument() {
    await this.shareButton.click()
    await expect(this.shareDialog).toBeVisible()
  }

  async copyShareLink(): Promise<string> {
    await this.shareDocument()
    await this.copyLinkButton.click()
    
    // Get clipboard content
    return await this.page.evaluate(() => navigator.clipboard.readText())
  }

  async shareViaEmail(email: string) {
    await this.shareDocument()
    await this.emailInput.fill(email)
    await this.shareEmailButton.click()
  }

  async returnToHome() {
    await this.homeButton.click()
    await this.waitForUrl('**/markup')
  }

  async searchDocuments(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
    await this.waitForLoadState()
  }

  async filterDocuments(filter: string) {
    await this.filterDropdown.click()
    await this.page.getByRole('option', { name: filter }).click()
    await this.waitForLoadState()
  }

  async toggleViewMode() {
    await this.viewModeToggle.click()
  }

  async deleteDocument(documentTitle: string) {
    const documentCard = this.documentCards.filter({ hasText: documentTitle })
    const deleteButton = documentCard.getByRole('button', { name: /delete|삭제/i })
    await deleteButton.click()
    
    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirm|확인/i })
    await confirmButton.click()
    await this.waitForLoadState()
  }

  async expectMarkupToolPageVisible() {
    await expect(this.pageHeader).toBeVisible()
    await expect(this.newMarkupButton).toBeVisible()
    await expect(this.documentsList).toBeVisible()
  }

  async expectEditorVisible() {
    await expect(this.canvas).toBeVisible()
    await expect(this.toolPalette).toBeVisible()
    await expect(this.topToolbar).toBeVisible()
  }

  async expectBlueprintLoaded() {
    await expect(this.blueprintImage).toBeVisible()
    await expect(this.canvas).toBeVisible()
  }

  async expectToolSelected(tool: string) {
    const toolButton = this.getByTestId(`${tool}-tool`)
    await expect(toolButton).toHaveClass(/selected|active/)
  }

  async expectMarkupExists() {
    // Check if there are markup objects on canvas
    const markupObjects = this.canvas.locator('.markup-object')
    await expect(markupObjects).toHaveCount(0) // Adjust based on implementation
  }

  async expectSaveDialogVisible() {
    await expect(this.saveDialog).toBeVisible()
    await expect(this.titleInput).toBeVisible()
  }

  async expectOpenDialogVisible() {
    await expect(this.openDialog).toBeVisible()
    await expect(this.documentGrid).toBeVisible()
  }

  async expectShareDialogVisible() {
    await expect(this.shareDialog).toBeVisible()
    await expect(this.shareUrlInput).toBeVisible()
  }

  async expectDocumentInList(title: string) {
    await expect(this.documentsList.getByText(title)).toBeVisible()
  }

  async expectSuccessMessage(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async expectValidationError(message: string | RegExp) {
    await expect(this.getByText(message)).toBeVisible()
  }

  async getDocumentCount(): Promise<number> {
    return await this.documentCards.count()
  }

  async getCanvasSize(): Promise<{ width: number; height: number }> {
    const boundingBox = await this.canvas.boundingBox()
    return {
      width: boundingBox?.width || 0,
      height: boundingBox?.height || 0
    }
  }
}