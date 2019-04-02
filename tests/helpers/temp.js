const path = require('path')
const fs = require('fs-extra')

const createTempDir = async () => {
  const tempDirPath = path.join(__dirname, '../temp')
  await fs.ensureDir(tempDirPath)

  return tempDirPath
}

const cleanupTempDir = async () => {
  const tempDirPath = path.join(__dirname, '../temp')

  await fs.remove(tempDirPath)
}

module.exports = {
  createTempDir,
  cleanupTempDir
}
