<!DOCTYPE html>
<html>
<head>
    <title>Index of /apps</title>
    <style>
        body {
            font-family: serif;
            margin: 20px;
            background: white;
        }
        h1 {
            font-size: 36px;
            font-weight: normal;
        }
        table {
            font-family: monospace;
            font-size: 20px;
        }
        th, td {
            text-align: left;
            padding-right: 25px;
            padding-top: 6px;
            padding-bottom: 6px;
        }
        a {
            color: blue;
        }
        hr {
            border: none;
            border-top: 2px solid #000;
            margin: 0;
        }
    </style>
</head>
<body>
    <h1>Index of /apps</h1>
    <input type="text" id="filter" placeholder="filter..." style="margin-bottom: 15px; font-family: monospace; font-size: 20px; padding: 6px;">
    <table>
        <tr>
            <th valign="top">&nbsp;</th>
            <th><a href="?C=N;O=D">Name</a></th>
            <th><a href="?C=M;O=A">Last modified</a></th>
            <th><a href="?C=S;O=A">Size</a></th>
            <th><a href="?C=D;O=A">Description</a></th>
        </tr>
        <tr><th colspan="5"><hr></th></tr>
        
        <?php
        // Get all HTML files from the apps directory
        $dir = __DIR__ . '/apps';
        $files = glob($dir . '/*.html');
        
        // Sort by filename by default
        sort($files);
        
        foreach($files as $file) {
            $filename = basename($file);
            $modified = date("d-M-Y H:i", filemtime($file));
            $size = filesize($file);
            
            // Format size like Apache
            if ($size < 1024) {
                $sizeStr = $size;
            } elseif ($size < 1048576) {
                $sizeStr = round($size / 1024) . 'K';
            } else {
                $sizeStr = round($size / 1048576, 1) . 'M';
            }
            
            echo '<tr class="file" data-name="' . htmlspecialchars($filename) . '">';
            echo '<td valign="top">&nbsp;</td>';
            echo '<td><a href="/apps/' . htmlspecialchars($filename) . '">' . htmlspecialchars($filename) . '</a></td>';
            echo '<td align="right">' . $modified . '  </td>';
            echo '<td align="right">' . str_pad($sizeStr, 4, ' ', STR_PAD_LEFT) . '</td>';
            echo '<td>&nbsp;</td>';
            echo '</tr>' . "\n";
        }
        ?>
        
        <tr><th colspan="5"><hr></th></tr>
    </table>
    
    <script>
        document.getElementById('filter').addEventListener('input', function(e) {
            var filter = e.target.value.toLowerCase();
            var rows = document.querySelectorAll('.file');
            
            rows.forEach(function(row) {
                var filename = row.getAttribute('data-name').toLowerCase();
                if (filename.indexOf(filter) > -1) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>