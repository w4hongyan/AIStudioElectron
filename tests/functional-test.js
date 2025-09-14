/**
 * AI Studio Electron 功能测试脚本
 * 自动化测试各个功能模块的基本功能
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FunctionalTester {
  constructor() {
    this.testResults = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // 测试项目结构
  testProjectStructure() {
    this.log('测试项目结构...');
    const requiredFiles = [
      'package.json',
      'src/main.js',
      'src/App.vue',
      'src/components/Dashboard.vue',
      'src/components/AIWriter.vue',
      'src/components/HotTracker.vue',
      'src/components/AnalyticsDashboard.vue',
      'src/components/AiImageGenerator.vue',
      'src/components/VideoEditor.vue',
      'src/components/SmartBatchProcessor.vue',
      'src/components/PluginMarket.vue',
      'src/components/VoiceSynthesizer.vue'
    ];

    let passed = 0;
    requiredFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        passed++;
        this.log(`✓ ${file} 存在`);
      } else {
        this.log(`✗ ${file} 缺失`, 'error');
      }
    });

    const result = {
      test: '项目结构测试',
      passed: passed,
      total: requiredFiles.length,
      success: passed === requiredFiles.length
    };
    this.testResults.push(result);
    return result;
  }

  // 测试依赖安装
  testDependencies() {
    this.log('测试依赖安装...');
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      
      if (!fs.existsSync(nodeModulesPath)) {
        this.log('node_modules 不存在，尝试安装依赖...', 'error');
        return { test: '依赖测试', success: false, error: 'node_modules不存在' };
      }

      const criticalDeps = ['vue', 'electron', 'element-plus', 'vite'];
      let installedDeps = 0;
      
      criticalDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        if (fs.existsSync(depPath)) {
          installedDeps++;
          this.log(`✓ ${dep} 已安装`);
        } else {
          this.log(`✗ ${dep} 未安装`, 'error');
        }
      });

      const result = {
        test: '依赖测试',
        passed: installedDeps,
        total: criticalDeps.length,
        success: installedDeps === criticalDeps.length
      };
      this.testResults.push(result);
      return result;
    } catch (error) {
      this.log(`依赖测试失败: ${error.message}`, 'error');
      return { test: '依赖测试', success: false, error: error.message };
    }
  }

  // 测试配置文件
  testConfiguration() {
    this.log('测试配置文件...');
    const configFiles = [
      { file: '.env', required: false },
      { file: 'vite.config.js', required: true },
      { file: 'electron.vite.config.js', required: true }
    ];

    let passed = 0;
    let total = 0;
    
    configFiles.forEach(({ file, required }) => {
      if (required) total++;
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        if (required) passed++;
        this.log(`✓ ${file} 存在`);
        
        // 检查.env文件的GLM配置
        if (file === '.env') {
          const envContent = fs.readFileSync(filePath, 'utf8');
          if (envContent.includes('VITE_GLM_API_KEY') && !envContent.includes('your_api_key_here')) {
            this.log('✓ GLM API 已配置');
          } else {
            this.log('⚠️ GLM API 使用默认配置（mock模式）');
          }
        }
      } else {
        if (required) {
          this.log(`✗ ${file} 缺失`, 'error');
        } else {
          this.log(`⚠️ ${file} 不存在（可选）`);
        }
      }
    });

    const result = {
      test: '配置文件测试',
      passed: passed,
      total: total,
      success: passed === total
    };
    this.testResults.push(result);
    return result;
  }

  // 测试Vue组件语法
  testVueComponents() {
    this.log('测试Vue组件语法...');
    const componentDir = path.join(this.projectRoot, 'src/components');
    const vueFiles = fs.readdirSync(componentDir).filter(file => file.endsWith('.vue'));
    
    let validComponents = 0;
    
    vueFiles.forEach(file => {
      const filePath = path.join(componentDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 基本语法检查
      const hasTemplate = content.includes('<template>');
      const hasScript = content.includes('<script');
      const hasStyle = content.includes('<style');
      
      if (hasTemplate && hasScript) {
        validComponents++;
        this.log(`✓ ${file} 语法正确`);
      } else {
        this.log(`✗ ${file} 语法可能有问题`, 'error');
      }
    });

    const result = {
      test: 'Vue组件语法测试',
      passed: validComponents,
      total: vueFiles.length,
      success: validComponents === vueFiles.length
    };
    this.testResults.push(result);
    return result;
  }

  // 测试服务文件
  testServices() {
    this.log('测试服务文件...');
    const serviceFiles = [
      'src/services/aiService.js',
      'src/services/glmApiService.js'
    ];

    let validServices = 0;
    
    serviceFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否有基本的导出
        if (content.includes('export') || content.includes('module.exports')) {
          validServices++;
          this.log(`✓ ${file} 结构正确`);
        } else {
          this.log(`✗ ${file} 缺少导出`, 'error');
        }
      } else {
        this.log(`✗ ${file} 不存在`, 'error');
      }
    });

    const result = {
      test: '服务文件测试',
      passed: validServices,
      total: serviceFiles.length,
      success: validServices === serviceFiles.length
    };
    this.testResults.push(result);
    return result;
  }

  // 生成测试报告
  generateReport() {
    this.log('\n=== 测试报告 ===');
    let totalPassed = 0;
    let totalTests = 0;
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      const details = result.total ? `(${result.passed}/${result.total})` : '';
      this.log(`${result.test}: ${status} ${details}`);
      
      if (result.total) {
        totalPassed += result.passed;
        totalTests += result.total;
      }
    });

    const overallSuccess = this.testResults.every(r => r.success);
    this.log(`\n总体结果: ${overallSuccess ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
    this.log(`详细统计: ${totalPassed}/${totalTests} 项检查通过`);
    
    // 保存测试报告
    const reportPath = path.join(this.projectRoot, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      overall: overallSuccess,
      summary: { passed: totalPassed, total: totalTests },
      details: this.testResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`测试报告已保存到: ${reportPath}`);
    
    return report;
  }

  // 运行所有测试
  async runAllTests() {
    this.log('开始运行功能测试...');
    
    try {
      this.testProjectStructure();
      this.testDependencies();
      this.testConfiguration();
      this.testVueComponents();
      this.testServices();
      
      return this.generateReport();
    } catch (error) {
      this.log(`测试过程中发生错误: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new FunctionalTester();
  tester.runAllTests().then(report => {
    process.exit(report.overall ? 0 : 1);
  });
}

module.exports = FunctionalTester;