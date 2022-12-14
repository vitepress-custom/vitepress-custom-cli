import fs from "fs-extra";
import path from "path";
import inquirer from 'inquirer';
import download from "download-git-repo";
import ora from 'ora';

// 获取当前工作目录
const cwd = process.cwd();
const spinner = ora();
export default async function (answers) {
    // 解构输入信息：项目名、作者、是否新建目录
    const { name, author, version, newDir } = answers;
    // 要创建的目录地址
    const targetDir = path.join(cwd, newDir ? name : '');
    // 新建目录&目录已存在
    if (newDir && fs.existsSync(targetDir)) {
        inquirer.prompt([
            {
                name: 'action',
                type: 'list',
                message: 'Target directory already exists Pick an action:',
                choices: [
                    {
                        name: 'Overwrite',
                        value: 'overwrite'
                    }, {
                        name: 'Cancel',
                        value: false
                    }
                ]
            }
        ]).then(res => {
            if (res.action === 'overwrite') {
                // 移除已存在目录
                fs.removeSync(targetDir);
                generate();
            }
            return;
        });
    } else {
        generate();
    }

    // 生成
    async function generate() {
        spinner.start('Downloading template...');
        const repositoryUrl = 'vitepress-custom/vitepress-custom-template';
        const branch = 'master';
        downloadRepository(repositoryUrl, branch);
    }
    // 下载储存库代码
    function downloadRepository(repositoryUrl, branch) {
        download(`${repositoryUrl}#${branch}`, targetDir, function (error) {
            if (error) {
                console.log("error", error);
                // 5 秒后重新下载
                setTimeout(() => {
                    downloadRepository();
                }, 5000);
            } else {
                changeConfig();
                // 下载成功
                spinner.succeed('Complete');
            }
        });
    }
    // 修改信息
    function changeConfig() {
        const projectRoot = `${process.cwd()}${newDir ? `/${name}` : ''}`;
        const packagePath = path.join(projectRoot, 'package.json');
        let packageInfo = JSON.parse(fs.readFileSync(packagePath));
        packageInfo.name = name;
        packageInfo.author = author;
        packageInfo.version = version;
        fs.writeFileSync(packagePath, JSON.stringify(packageInfo, null, 2));
    }
};

