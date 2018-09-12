import bs4
import os, sys

def ReplaceAddress(address):
    soup = None
    with open("index.html") as file:
        html = file.read()
        soup = bs4.BeautifulSoup(html, "lxml")

    all_scripts = soup.find_all('script')
    addr_script = all_scripts[0]
    addr_script["src"] = "http://" + address + "/socket.io/socket.io.js"
    with open("index.html", "w") as outfile:
        outfile.write(str(soup))

    lines = None
    with open("index.html") as f:
        lines = f.readlines()

    searchterm = "var socket = io.connect"
    for i in range(len(lines)):
        if searchterm in lines[i]:
            lines[i] = "<script>var socket = io.connect('" + "http://" + address + "');</script>\n"

    with open("index.html", 'w') as final_file:
        final_file.writelines(lines)

if __name__ == "__main__":
    if (len(sys.argv) > 1):
        searchterm = '+'.join(sys.argv[1:])
    else:
        print("Please provide an address [ex: 127.0.0.1:8080].")
