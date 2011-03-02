BUILDDIR := build
SRCDIR := js
DEPENDENCIES := dependency.list

all: $(BUILDDIR)/sparks.js
.PHONY: all

clean:
	rm -rf $(BUILDDIR)

$(BUILDDIR)/sparks.js: $(DEPENDENCIES) | $(BUILDDIR)
	sed -e 's#^#$(SRCDIR)/#' ./$(DEPENDENCIES) | xargs cat >$(BUILDDIR)/sparks.js

$(BUILDDIR):
	mkdir $(BUILDDIR)
