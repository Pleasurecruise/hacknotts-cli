def main():
    print("请输入字符画，输入空行结束：")

    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line == "":
            break
        lines.append(line)

    # 转义：把反斜杠和引号处理掉，方便嵌入字符串
    escaped_lines = [line.replace("\\", "\\\\").replace('"', '\\"') for line in lines]

    # 输出为 Python/JS 可用的多行字符串形式
    print("\n转义后的字符画：\n")
    for l in escaped_lines:
        print(f'"{l}\\n" +')
    print('""')  # 结尾空字符串避免多余的加号


if __name__ == "__main__":
    main()
