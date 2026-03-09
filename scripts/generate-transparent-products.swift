import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import AppKit

let fileManager = FileManager.default
let ciContext = CIContext(options: [.useSoftwareRenderer: false])

let rootURL = URL(fileURLWithPath: fileManager.currentDirectoryPath)
let sourceDir = rootURL.appendingPathComponent("public/products", isDirectory: true)
let outputDir = sourceDir.appendingPathComponent("transparent", isDirectory: true)

try fileManager.createDirectory(at: outputDir, withIntermediateDirectories: true)

let sourceFiles = try fileManager.contentsOfDirectory(at: sourceDir, includingPropertiesForKeys: nil)
  .filter { url in
    let name = url.lastPathComponent.lowercased()
    return name.hasPrefix("product-") && (name.hasSuffix(".jpeg") || name.hasSuffix(".jpg"))
  }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

for sourceURL in sourceFiles {
  guard let sourceImage = CIImage(contentsOf: sourceURL) else {
    fputs("skip \(sourceURL.lastPathComponent): unreadable image\n", stderr)
    continue
  }

  let request = VNGenerateForegroundInstanceMaskRequest()
  let handler = VNImageRequestHandler(ciImage: sourceImage, options: [:])
  try handler.perform([request])

  guard let observation = request.results?.first else {
    fputs("skip \(sourceURL.lastPathComponent): no foreground mask\n", stderr)
    continue
  }

  let maskBuffer = try observation.generateScaledMaskForImage(forInstances: observation.allInstances, from: handler)
  let maskImage = CIImage(cvPixelBuffer: maskBuffer)
  let transparentBackground = CIImage(color: .clear).cropped(to: sourceImage.extent)

  let blend = CIFilter.blendWithMask()
  blend.inputImage = sourceImage
  blend.backgroundImage = transparentBackground
  blend.maskImage = maskImage

  guard
    let outputImage = blend.outputImage,
    let outputCGImage = ciContext.createCGImage(outputImage, from: outputImage.extent)
  else {
    fputs("skip \(sourceURL.lastPathComponent): render failure\n", stderr)
    continue
  }

  let bitmap = NSBitmapImageRep(cgImage: outputCGImage)

  guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
    fputs("skip \(sourceURL.lastPathComponent): png encode failure\n", stderr)
    continue
  }

  let outputURL = outputDir.appendingPathComponent(sourceURL.deletingPathExtension().lastPathComponent + ".png")
  try pngData.write(to: outputURL)
  print("generated \(outputURL.path)")
}
