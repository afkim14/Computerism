import bs4
import os, sys

def ReplaceAddress(dir, address):
    soup = None
    with open(dir + "index.html") as file:
        html = file.read()
        soup = bs4.BeautifulSoup(html, "lxml")

    all_scripts = soup.find_all('script')
    addr_script = all_scripts[0]
    addr_script["src"] = "http://" + address + "/socket.io/socket.io.js"
    with open(dir + "index.html", "w") as outfile:
        outfile.write(str(soup))

    lines = None
    with open(dir + "index.html") as f:
        lines = f.readlines()

    searchterm = "var socket = io.connect"
    for i in range(len(lines)):
        if searchterm in lines[i]:
            lines[i] = "<script>var socket = io.connect('" + "http://" + address + "');</script>\n"

    with open(dir + "index.html", 'w') as final_file:
        final_file.writelines(lines)

if __name__ == "__main__":
    if (len(sys.argv) > 2):
        directories = next(os.walk("."))[1]
        target_dir = "./" + sys.argv[1]
        if (target_dir[len(target_dir)-1] != "/"): target_dir += "/"
        if (not os.path.isdir(target_dir)):
            print("Directory does not exist. Please try again.")
            exit()
        ReplaceAddress(target_dir, sys.argv[2])
    else:
        print("python3 update_address.py [directory] [address:port]")
